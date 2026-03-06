import { NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit";
import { getAuthContext } from "@/lib/auth";
import { calculateExtendedDeadline, getDeadlineStatus } from "@/lib/dsar/deadline";
import { requestUpdateSchema } from "@/lib/dsar/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuditEvent, RequestRecord } from "@/types";
import type { Database } from "@/types/database";

interface RequestRouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  { params }: RequestRouteProps,
) {
  try {
    const { id } = await params;
    const authContext = await getAuthContext();

    if (!authContext?.company) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const [{ data: request }, { data: auditEvents }] = await Promise.all([
      supabase
        .from("requests")
        .select("*")
        .eq("company_id", authContext.company.id)
        .eq("id", id)
        .single(),
      supabase
        .from("audit_events")
        .select("*")
        .eq("company_id", authContext.company.id)
        .eq("request_id", id)
        .order("created_at", { ascending: false }),
    ]);
    const typedRequest = request as RequestRecord | null;
    const typedAuditEvents = (auditEvents ?? []) as AuditEvent[];

    if (!typedRequest) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({
      ...typedRequest,
      deadlineStatus: getDeadlineStatus(
        new Date(typedRequest.extended_deadline_at ?? typedRequest.deadline_at),
      ),
      audit_events: typedAuditEvents,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to fetch request",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: RequestRouteProps,
) {
  try {
    const { id } = await params;
    const authContext = await getAuthContext();

    if (!authContext?.company) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = requestUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data: existing } = await supabase
      .from("requests")
      .select("*")
      .eq("company_id", authContext.company.id)
      .eq("id", id)
      .single();
    const typedExisting = existing as RequestRecord | null;

    if (!typedExisting) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const updates: Database["public"]["Tables"]["requests"]["Update"] = {
      ...parsed.data,
    };

    if (parsed.data.status === "extended") {
      updates.extended_deadline_at = calculateExtendedDeadline(
        new Date(typedExisting.received_at),
      ).toISOString();
    }

    if (parsed.data.status === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    const { data: updated, error } = await supabase
      .from("requests")
      .update(updates)
      .eq("company_id", authContext.company.id)
      .eq("id", id)
      .select("*")
      .single();
    const typedUpdated = updated as RequestRecord | null;

    if (error || !typedUpdated) {
      throw error ?? new Error("Unable to update request");
    }

    if (parsed.data.status && parsed.data.status !== typedExisting.status) {
      await logAuditEvent(supabase, {
        requestId: id,
        companyId: authContext.company.id,
        eventType:
          parsed.data.status === "extended"
            ? "deadline_extended"
            : parsed.data.status === "refused"
              ? "request_refused"
              : "status_changed",
        actor: authContext.user,
        details: {
          from: typedExisting.status,
          to: parsed.data.status,
        },
      });
    }

    if (
      parsed.data.assigned_to !== undefined &&
      parsed.data.assigned_to !== typedExisting.assigned_to
    ) {
      await logAuditEvent(supabase, {
        requestId: id,
        companyId: authContext.company.id,
        eventType: "request_assigned",
        actor: authContext.user,
        details: {
          assigned_to: parsed.data.assigned_to,
        },
      });
    }

    if (
      parsed.data.identity_verified !== undefined &&
      parsed.data.identity_verified !== typedExisting.identity_verified
    ) {
      await logAuditEvent(supabase, {
        requestId: id,
        companyId: authContext.company.id,
        eventType: "identity_verified",
        actor: authContext.user,
        details: {
          identity_verified: parsed.data.identity_verified,
          method: parsed.data.identity_method ?? "manual",
        },
      });
    }

    if (
      parsed.data.internal_notes !== undefined &&
      parsed.data.internal_notes !== typedExisting.internal_notes
    ) {
      await logAuditEvent(supabase, {
        requestId: id,
        companyId: authContext.company.id,
        eventType: "note_added",
        actor: authContext.user,
        details: {
          internal_notes: parsed.data.internal_notes,
        },
      });
    }

    return NextResponse.json(typedUpdated);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update request",
      },
      { status: 500 },
    );
  }
}
