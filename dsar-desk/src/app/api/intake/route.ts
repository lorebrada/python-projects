import { NextResponse } from "next/server";
import { createElement } from "react";
import { subDays, format } from "date-fns";

import RequestAcknowledgment from "@/components/emails/RequestAcknowledgment";
import { logAuditEvent } from "@/lib/audit";
import { calculateDeadline } from "@/lib/dsar/deadline";
import { RIGHT_TYPE_LABELS } from "@/lib/dsar/reference";
import { publicIntakeSchema } from "@/lib/dsar/schemas";
import { sendEmail } from "@/lib/mailer";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Company, RequestRecord, RightType } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = publicIntakeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const admin = createSupabaseAdminClient();
    const { data: company } = await admin
      .from("companies")
      .select("*")
      .eq("intake_token", parsed.data.token)
      .eq("intake_enabled", true)
      .single();
    const typedCompany = company as Company | null;

    if (!typedCompany) {
      return NextResponse.json({ error: "invalid_token" }, { status: 404 });
    }

    const since = subDays(new Date(), 1).toISOString();
    const { count } = await admin
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("company_id", typedCompany.id)
      .eq("requester_email", parsed.data.requester_email)
      .gte("created_at", since);

    if ((count ?? 0) >= 5) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const now = new Date();
    const deadline = calculateDeadline(now);
    const rightType: RightType =
      parsed.data.right_type === "not_sure" ? "access" : parsed.data.right_type;
    const requesterIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    const { data: createdRequest, error } = await admin
      .from("requests")
      .insert({
        company_id: typedCompany.id,
        right_type: rightType,
        requester_name: parsed.data.requester_name,
        requester_email: parsed.data.requester_email,
        description: parsed.data.description,
        received_at: now.toISOString(),
        deadline_at: deadline.toISOString(),
        source: "intake_form",
        requester_ip: requesterIp,
      })
      .select("*")
      .single();
    const typedRequest = createdRequest as RequestRecord | null;

    if (error || !typedRequest) {
      throw error ?? new Error("Unable to create request");
    }

    await logAuditEvent(admin, {
      requestId: typedRequest.id,
      companyId: typedCompany.id,
      eventType: "intake_form_submitted",
      details: {
        original_right_type: parsed.data.right_type,
      },
      ipAddress: requesterIp,
    });

    await logAuditEvent(admin, {
      requestId: typedRequest.id,
      companyId: typedCompany.id,
      eventType: "request_received",
      details: {
        source: "intake_form",
        requester_email: typedRequest.requester_email,
      },
      ipAddress: requesterIp,
    });

    await sendEmail({
      to: typedRequest.requester_email,
      subject: `Data request received - ${typedCompany.name} will respond by ${format(deadline, "PPP")}`,
      react: createElement(RequestAcknowledgment, {
        requester_name: typedRequest.requester_name,
        company_name: typedCompany.name,
        right_type: RIGHT_TYPE_LABELS[rightType],
        request_id: typedRequest.id,
        received_date: format(now, "PPP"),
        deadline_date: format(deadline, "PPP"),
        dpo_email:
          typedCompany.dpo_email ??
          "privacy@" + (typedCompany.domain ?? "company.com"),
      }),
    });

    await logAuditEvent(admin, {
      requestId: typedRequest.id,
      companyId: typedCompany.id,
      eventType: "acknowledgment_sent",
      details: {
        to: typedRequest.requester_email,
      },
      ipAddress: requesterIp,
    });

    if (typedCompany.dpo_email) {
      await sendEmail({
        to: typedCompany.dpo_email,
        subject: `New DSAR intake submission for ${typedCompany.name}`,
        html: `<p>A new ${RIGHT_TYPE_LABELS[rightType]} request has been submitted.</p><p>Requester: ${typedRequest.requester_name} (${typedRequest.requester_email})</p><p>Reference: ${typedRequest.id}</p>`,
      });
    }

    return NextResponse.json({
      id: typedRequest.id,
      deadline_at: typedRequest.deadline_at,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to submit request",
      },
      { status: 500 },
    );
  }
}
