import { NextResponse } from "next/server";
import { createElement } from "react";

import PaymentFailed from "@/components/emails/PaymentFailed";
import WelcomeEmail from "@/components/emails/WelcomeEmail";
import { getAppUrl, requireEnv } from "@/lib/env";
import { sendEmail } from "@/lib/mailer";
import { getPlanByPriceId, PLANS } from "@/lib/stripe/plans";
import { getStripeServerClient } from "@/lib/stripe/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Company, Profile } from "@/types";

export const runtime = "nodejs";

async function findProfileByCustomerId(customerId: string) {
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  return (profile as Profile | null) ?? null;
}

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  try {
    const stripe = getStripeServerClient();
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      requireEnv("STRIPE_WEBHOOK_SECRET"),
    );
    const admin = createSupabaseAdminClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const companyId = session.metadata?.companyId;
        const metadataPlan = session.metadata?.plan as keyof typeof PLANS | undefined;
        const plan = metadataPlan ? PLANS[metadataPlan] : getPlanByPriceId(session.metadata?.priceId);

        if (userId) {
          await admin
            .from("profiles")
            .update({
              plan: plan.key,
              stripe_customer_id: session.customer?.toString() ?? null,
            })
            .eq("id", userId);

          await admin.from("subscriptions").upsert(
            {
              user_id: userId,
              stripe_subscription_id: session.subscription?.toString() ?? "",
              stripe_price_id: plan.stripePriceId,
              plan: plan.key,
              status: "active",
            },
            {
              onConflict: "stripe_subscription_id",
            },
          );

          const [{ data: profile }, { data: company }] = await Promise.all([
            admin.from("profiles").select("*").eq("id", userId).single(),
            companyId
              ? admin.from("companies").select("*").eq("id", companyId).maybeSingle()
              : Promise.resolve({ data: null }),
          ]);
          const typedProfile = profile as Profile | null;
          const typedCompany = company as Company | null;

          if (typedProfile) {
            await sendEmail({
              to: typedProfile.email,
              subject: "Welcome to DSAR Desk - you're set up in minutes",
              react: createElement(WelcomeEmail, {
                name: typedProfile.full_name ?? typedProfile.email,
                company_name: typedCompany?.name ?? "Your company",
                dashboard_url: `${getAppUrl()}/dashboard`,
                intake_url: typedCompany?.intake_token
                  ? `${getAppUrl()}/intake/${typedCompany.intake_token}`
                  : `${getAppUrl()}/dashboard`,
              }),
            });
          }
        }

        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const plan = getPlanByPriceId(subscription.items.data[0]?.price.id);
        const profile = await findProfileByCustomerId(subscription.customer.toString());

        if (profile) {
          await admin
            .from("profiles")
            .update({ plan: plan.key })
            .eq("id", profile.id);

          const currentPeriodEnd = (
            subscription as unknown as { current_period_end: number }
          ).current_period_end;
          await admin.from("subscriptions").upsert(
            {
              user_id: profile.id,
              stripe_subscription_id: subscription.id,
              stripe_price_id: subscription.items.data[0]?.price.id ?? "",
              plan: plan.key,
              status: subscription.status,
              current_period_end: currentPeriodEnd
                ? new Date(currentPeriodEnd * 1000).toISOString()
                : null,
              cancel_at_period_end: subscription.cancel_at_period_end,
            },
            {
              onConflict: "stripe_subscription_id",
            },
          );
        }

        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const profile = await findProfileByCustomerId(subscription.customer.toString());

        if (profile) {
          await admin.from("profiles").update({ plan: "solo" }).eq("id", profile.id);
          await admin
            .from("subscriptions")
            .update({
              status: subscription.status,
              plan: "solo",
              cancel_at_period_end: subscription.cancel_at_period_end,
            })
            .eq("stripe_subscription_id", subscription.id);
        }

        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const profile = await findProfileByCustomerId(invoice.customer?.toString() ?? "");

        if (profile) {
          await sendEmail({
            to: profile.email,
            subject: "Payment failed for your DSAR Desk subscription",
            react: createElement(PaymentFailed, {
              company_name: profile.email,
              billing_url: `${getAppUrl()}/billing`,
            }),
          });
        }

        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook error",
      },
      { status: 400 },
    );
  }
}
