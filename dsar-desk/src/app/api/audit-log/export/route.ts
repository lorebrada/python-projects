import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { differenceInDays } from "date-fns";

import AuditLogPDF from "@/components/pdf/AuditLogPDF";
import { getAuthContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuditEvent, RequestRecord } from "@/types";

function toCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\n");
}

export async function GET(request: Request) {
  try {
    const authContext = await getAuthContext();

    if (!authContext?.company) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const format = url.searchParams.get("format") ?? "pdf";
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const requestId = url.searchParams.get("requestId");

    if (format === "pdf" && authContext.profile.plan === "solo") {
      return NextResponse.json({ error: "upgrade_required" }, { status: 402 });
    }

    const supabase = await createSupabaseServerClient();
    let auditQuery = supabase
      .from("audit_events")
      .select("*")
      .eq("company_id", authContext.company.id)
      .order("created_at", { ascending: true });

    if (from) {
      auditQuery = auditQuery.gte("created_at", from);
    }

    if (to) {
      auditQuery = auditQuery.lte("created_at", to);
    }

    if (requestId) {
      auditQuery = auditQuery.eq("request_id", requestId);
    }

    const { data: eventsData } = await auditQuery;
    const events = (eventsData ?? []) as AuditEvent[];
    const requestIds = [...new Set(events.map((event) => event.request_id))];
    const { data: requestsData } = requestIds.length
      ? await supabase.from("requests").select("*").in("id", requestIds)
      : { data: [] };
    const requests = (requestsData ?? []) as RequestRecord[];

    const requestMap = new Map(requests.map((item) => [item.id, item]));
    const pdfRequests = requestIds
      .map((id) => ({
        request: requestMap.get(id),
        auditEvents: events.filter((event) => event.request_id === id),
      }))
      .filter((item): item is { request: RequestRecord; auditEvents: AuditEvent[] } =>
        Boolean(item.request),
      );

    if (format === "csv") {
      const csv = toCsv(
        events.map((event) => ({
          created_at: event.created_at,
          request_id: event.request_id,
          event_type: event.event_type,
          actor_email: event.actor_email ?? "",
          details: event.details ? JSON.stringify(event.details) : "",
        })),
      );

      return new NextResponse(csv, {
        headers: {
          "Content-Disposition": 'attachment; filename="audit-log.csv"',
          "Content-Type": "text/csv; charset=utf-8",
        },
      });
    }

    const totalRequests = requests.length;
    const completed = requests.filter((item) => item.completed_at);
    const completedOnTime = completed.filter((item) => {
      const deadline = new Date(item.extended_deadline_at ?? item.deadline_at);
      return new Date(item.completed_at ?? deadline) <= deadline;
    }).length;
    const averageResponseDays =
      completed.length > 0
        ? completed.reduce((sum, item) => {
            return (
              sum +
              differenceInDays(
                new Date(item.completed_at ?? item.received_at),
                new Date(item.received_at),
              )
            );
          }, 0) / completed.length
        : 0;
    const overdue = requests.filter((item) => item.status === "overdue").length;
    const byRightType = requests.reduce<Record<string, number>>((acc, item) => {
      acc[item.right_type] = (acc[item.right_type] ?? 0) + 1;
      return acc;
    }, {});

    const buffer = await renderToBuffer(
      AuditLogPDF({
        companyName: authContext.company.name,
        from,
        generatedAt: new Date().toISOString(),
        logoUrl: authContext.company.logo_url,
        requests: pdfRequests,
        stats: {
          averageResponseDays,
          byRightType,
          completedOnTime,
          completedOnTimeRate:
            totalRequests > 0 ? (completedOnTime / totalRequests) * 100 : 0,
          overdue,
          totalRequests,
        },
        to,
      }),
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Disposition": 'attachment; filename="audit-log.pdf"',
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to export audit log",
      },
      { status: 500 },
    );
  }
}
