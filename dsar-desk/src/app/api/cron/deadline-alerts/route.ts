import { NextResponse } from "next/server";
import { createElement } from "react";
import { addDays } from "date-fns";

import DeadlineAlert from "@/components/emails/DeadlineAlert";
import { logAuditEvent } from "@/lib/audit";
import { requireEnv } from "@/lib/env";
import { sendEmail } from "@/lib/mailer";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDeadlineStatus } from "@/lib/dsar/deadline";
import type { Company, Profile, RequestRecord, SubscriptionRecord } from "@/types";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${requireEnv("CRON_SECRET")}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();
    const { data: subscriptions } = await admin
      .from("subscriptions")
      .select("*")
      .in("status", ["active", "trialing", "past_due"]);
    const typedSubscriptions = (subscriptions ?? []) as SubscriptionRecord[];

    const userIds = [
      ...new Set(
        typedSubscriptions.map((item) => item.user_id).filter(Boolean) as string[],
      ),
    ];
    const [{ data: companies }, { data: profiles }] = await Promise.all([
      userIds.length
        ? admin.from("companies").select("*").in("owner_id", userIds as string[])
        : Promise.resolve({ data: [] }),
      userIds.length
        ? admin.from("profiles").select("*").in("id", userIds as string[])
        : Promise.resolve({ data: [] }),
    ]);
    const typedCompanies = (companies ?? []) as Company[];
    const typedProfiles = (profiles ?? []) as Profile[];

    const profileMap = new Map(typedProfiles.map((profile) => [profile.id, profile]));
    let alertsSent = 0;
    let overdueUpdated = 0;
    const errors: string[] = [];

    for (const company of typedCompanies) {
      try {
        const { data: requestsData } = await admin
          .from("requests")
          .select("*")
          .eq("company_id", company.id)
          .not("status", "in", '("completed","refused")')
          .lte("deadline_at", addDays(new Date(), 7).toISOString());
        const requests = (requestsData ?? []) as RequestRecord[];

        const overdue = requests.filter(
          (item) =>
            new Date(item.extended_deadline_at ?? item.deadline_at) < new Date() &&
            ["open", "in_progress", "awaiting_verification", "extended"].includes(
              item.status,
            ),
        );

        if (overdue.length > 0) {
          const overdueIds = overdue.map((item) => item.id);
          await admin
            .from("requests")
            .update({ status: "overdue" })
            .in("id", overdueIds);
          overdueUpdated += overdueIds.length;
        }

        if (requests.length > 0) {
          const ownerProfile = company.owner_id
            ? profileMap.get(company.owner_id)
            : undefined;
          const recipient = company.dpo_email ?? ownerProfile?.email;

          if (recipient) {
            await sendEmail({
              to: recipient,
              subject: `⚠️ ${requests.length} DSAR requests need attention — deadlines approaching`,
              react: createElement(DeadlineAlert, {
                company_name: company.name,
                user_name: ownerProfile?.full_name ?? recipient,
                requests: requests.map((item) => ({
                  id: item.id,
                  requester_name: item.requester_name,
                  right_type: item.right_type,
                  deadline_at: item.extended_deadline_at ?? item.deadline_at,
                  days_remaining: getDeadlineStatus(
                    new Date(item.extended_deadline_at ?? item.deadline_at),
                  ).daysRemaining,
                })),
              }),
            });

            alertsSent += 1;
          }

          for (const dsar of requests) {
            await logAuditEvent(admin, {
              requestId: dsar.id,
              companyId: company.id,
              eventType: "deadline_alert_sent",
              details: {
                recipient: company.dpo_email ?? ownerProfile?.email ?? null,
              },
            });
          }
        }
      } catch (error) {
        errors.push(
          `${company.id}: ${error instanceof Error ? error.message : "unknown error"}`,
        );
      }
    }

    return NextResponse.json({
      companies_checked: typedCompanies.length,
      alerts_sent: alertsSent,
      overdue_updated: overdueUpdated,
      errors,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to run cron",
      },
      { status: 500 },
    );
  }
}
