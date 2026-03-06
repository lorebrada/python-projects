import { NextResponse } from "next/server";
import { createElement } from "react";
import { format } from "date-fns";

import RequestAcknowledgment from "@/components/emails/RequestAcknowledgment";
import { logAuditEvent } from "@/lib/audit";
import { getAuthContext } from "@/lib/auth";
import { calculateDeadline, getDeadlineStatus } from "@/lib/dsar/deadline";
import { RIGHT_TYPE_LABELS } from "@/lib/dsar/reference";
import { requestCreateSchema } from "@/lib/dsar/schemas";
import { sendEmail } from "@/lib/mailer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RequestRecord, RequestStatus } from "@/types";
import { getCompanyRequests, getCompanyUsageThisMonth } from "@/lib/server-data";
import { PLANS } from "@/lib/stripe/plans";

export async function POST(request: Request) {
  try {
    const authContext = await getAuthContext();

    if (!authContext?.company) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = requestCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if (parsed.data.company_id !== authContext.company.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    if (authContext.profile.plan === "solo") {
      const usage = await getCompanyUsageThisMonth(authContext.company.id);

      if (usage >= PLANS.solo.maxRequests) {
        return NextResponse.json(
          {
            error: "plan_limit",
            upgrade_url: "/billing",
          },
          { status: 402 },
        );
      }
    }

    const supabase = await createSupabaseServerClient();
    const receivedAt = parsed.data.received_at ?? new Date();
    const deadline = calculateDeadline(receivedAt);
    const requesterIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    const { data: createdRequest, error } = await supabase
      .from("requests")
      .insert({
        company_id: authContext.company.id,
        right_type: parsed.data.right_type,
        requester_name: parsed.data.requester_name,
        requester_email: parsed.data.requester_email,
        description: parsed.data.description,
        internal_notes: parsed.data.internal_notes,
        received_at: receivedAt.toISOString(),
        deadline_at: deadline.toISOString(),
        source: parsed.data.source,
        assigned_to: parsed.data.assigned_to,
        requester_ip: requesterIp,
      })
      .select("*")
      .single();
    const typedRequest = createdRequest as RequestRecord | null;

    if (error || !typedRequest) {
      throw error ?? new Error("Unable to create request");
    }

    await logAuditEvent(supabase, {
      requestId: typedRequest.id,
      companyId: authContext.company.id,
      eventType: "request_received",
      actor: authContext.user,
      details: {
        right_type: typedRequest.right_type,
        source: typedRequest.source,
      },
      ipAddress: requesterIp,
    });

    await sendEmail({
      to: typedRequest.requester_email,
      subject: `Data request received - ${authContext.company.name} will respond by ${format(
        deadline,
        "PPP",
      )}`,
      react: createElement(RequestAcknowledgment, {
        requester_name: typedRequest.requester_name,
        company_name: authContext.company.name,
        right_type: RIGHT_TYPE_LABELS[typedRequest.right_type],
        request_id: typedRequest.id,
        received_date: format(new Date(typedRequest.received_at), "PPP"),
        deadline_date: format(deadline, "PPP"),
        dpo_email:
          authContext.company.dpo_email ?? authContext.profile.email,
      }),
    });

    await logAuditEvent(supabase, {
      requestId: typedRequest.id,
      companyId: authContext.company.id,
      eventType: "acknowledgment_sent",
      actor: authContext.user,
      details: {
        to: typedRequest.requester_email,
      },
      ipAddress: requesterIp,
    });

    return NextResponse.json(typedRequest);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create request",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const authContext = await getAuthContext();

    if (!authContext?.company) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const companyId = url.searchParams.get("company_id") ?? authContext.company.id;
    const status = url.searchParams.get("status") ?? undefined;
    const page = Number(url.searchParams.get("page") ?? "1");
    const limit = Number(url.searchParams.get("limit") ?? "20");

    if (companyId !== authContext.company.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const result = await getCompanyRequests({
      companyId,
      status: status as RequestStatus | undefined,
      page,
      limit,
    });

    return NextResponse.json({
      ...result,
      requests: result.requests.map((request) => ({
        ...request,
        deadlineStatus: getDeadlineStatus(
          new Date(request.extended_deadline_at ?? request.deadline_at),
        ),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to fetch requests",
      },
      { status: 500 },
    );
  }
}
