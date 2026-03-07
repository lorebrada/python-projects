import { NextResponse } from "next/server";

import { getAuthContext } from "@/lib/auth";
import { activateDemoPlan } from "@/lib/demo-store";
import { getAppUrl, isDemoMode } from "@/lib/env";
import { PLANS } from "@/lib/stripe/plans";
import { getStripeServerClient } from "@/lib/stripe/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const authContext = await getAuthContext();

    if (!authContext?.company) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const planKey = url.searchParams.get("plan");

    if (!planKey || !(planKey in PLANS)) {
      return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
    }

    const plan = PLANS[planKey as keyof typeof PLANS];

    if (isDemoMode()) {
      activateDemoPlan(plan.key);
      return NextResponse.redirect(
        `${getAppUrl()}/billing?checkout=success&plan=${plan.key}`,
      );
    }

    const stripe = getStripeServerClient();
    const supabase = await createSupabaseServerClient();

    let customerId = authContext.profile.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: authContext.profile.email,
        name: authContext.company.name,
        metadata: {
          userId: authContext.user.id,
          companyId: authContext.company.id,
        },
      });
      customerId = customer.id;

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", authContext.user.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: authContext.user.id,
        companyId: authContext.company.id,
        plan: plan.key,
      },
      success_url: `${getAppUrl()}/billing?checkout=success`,
      cancel_url: `${getAppUrl()}/billing?checkout=cancelled`,
    });

    return NextResponse.redirect(session.url ?? `${getAppUrl()}/billing`);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create checkout session",
      },
      { status: 500 },
    );
  }
}
