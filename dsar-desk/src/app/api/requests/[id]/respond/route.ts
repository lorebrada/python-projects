import { NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit";
import { getAuthContext } from "@/lib/auth";
import { requestResponseSchema } from "@/lib/dsar/schemas";
import { getDemoRequestDetail, respondToDemoRequest } from "@/lib/demo-store";
import { isDemoMode } from "@/lib/env";
import { sendEmail } from "@/lib/mailer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildTemplateVariables, resolveTemplate, resolveTemplateString } from "@/lib/template-resolver";
import type { RequestRecord, ResponseTemplate } from "@/types";

interface RequestRespondRouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: Request,
  { params }: RequestRespondRouteProps,
) {
  try {
    const { id } = await params;
    const authContext = await getAuthContext();

    if (!authContext?.company) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = requestResponseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if (isDemoMode()) {
      const detail = getDemoRequestDetail(authContext.company.id, id);
      if (!detail) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }

      const variables = buildTemplateVariables({
        request: detail.request,
        company: authContext.company,
      });

      const resolvedSubject = `Response regarding your data request - ${authContext.company.name}`;
      const resolvedBody = resolveTemplateString(parsed.data.custom_body, variables);
      const demoResult = respondToDemoRequest(authContext.company.id, id, {
        subject: resolvedSubject,
        body: resolvedBody,
        sendEmail: parsed.data.send_email,
      });

      return NextResponse.json({
        sent: parsed.data.send_email,
        audit_event_id: demoResult?.auditEvent.id ?? null,
      });
    }

    const supabase = await createSupabaseServerClient();
    const { data: requestRecord } = await supabase
      .from("requests")
      .select("*")
      .eq("company_id", authContext.company.id)
      .eq("id", id)
      .single();
    const typedRequest = requestRecord as RequestRecord | null;

    if (!typedRequest) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    let template: ResponseTemplate | null = null;

    if (parsed.data.template_id) {
      const { data } = await supabase
        .from("templates")
        .select("*")
        .eq("company_id", authContext.company.id)
        .eq("id", parsed.data.template_id)
        .single();

      template = (data as ResponseTemplate | null) ?? null;
    }

    const variables = buildTemplateVariables({
      request: typedRequest,
      company: authContext.company,
    });

    const resolvedSubject = template
      ? resolveTemplate(template, variables).subject
      : `Response regarding your data request - ${authContext.company.name}`;
    const resolvedBody = template
      ? resolveTemplate(
          {
            subject: resolvedSubject,
            body: parsed.data.custom_body || template.body,
          },
          variables,
        ).body
      : resolveTemplateString(parsed.data.custom_body, variables);

    if (parsed.data.send_email) {
      await sendEmail({
        to: typedRequest.requester_email,
        subject: resolvedSubject,
        html: `<div style="font-family: system-ui, sans-serif; white-space: pre-wrap">${resolvedBody}</div>`,
      });
    }

    const auditEvent = await logAuditEvent(supabase, {
      requestId: id,
      companyId: authContext.company.id,
      eventType: "response_sent",
      actor: authContext.user,
      details: {
        subject: resolvedSubject,
        body: resolvedBody,
        sent: parsed.data.send_email,
      },
    });
    const typedAuditEvent = auditEvent as { id: string };

    if (parsed.data.send_email) {
      await supabase
        .from("requests")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("company_id", authContext.company.id)
        .eq("id", id);
    }

    return NextResponse.json({
      sent: parsed.data.send_email,
      audit_event_id: typedAuditEvent.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to send response",
      },
      { status: 500 },
    );
  }
}
