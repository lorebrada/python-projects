import "server-only";

import { addDays, endOfMonth, startOfMonth } from "date-fns";

import { getAuthContext } from "@/lib/auth";
import { getDeadlineStatus } from "@/lib/dsar/deadline";
import type {
  AuditEvent,
  AuditEventType,
  DeadlineAwareRequest,
  Profile,
  RequestRecord,
  RequestStatus,
  ResponseTemplate,
  TemplateRightType,
} from "@/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface TeamMemberOption {
  user_id: string;
  role: string;
  full_name: string | null;
  email: string;
}

export async function getCompanyMembers(companyId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: membersData } = await supabase
    .from("company_members")
    .select("*")
    .eq("company_id", companyId);
  const members = (membersData ?? []) as Array<{
    user_id: string;
    role: string;
  }>;

  const userIds = members?.map((member) => member.user_id) ?? [];

  if (userIds.length === 0) {
    return [] satisfies TeamMemberOption[];
  }

  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);
  const profiles = (profilesData ?? []) as Pick<
    Profile,
    "id" | "full_name" | "email"
  >[];

  const profileMap = new Map(profiles?.map((profile) => [profile.id, profile]));

  return members.map((member) => ({
    user_id: member.user_id,
    role: member.role,
    full_name: profileMap.get(member.user_id)?.full_name ?? null,
    email: profileMap.get(member.user_id)?.email ?? "",
  }));
}

export async function getTemplatesForCompany(
  companyId: string,
  rightType?: TemplateRightType,
) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("templates")
    .select("*")
    .eq("company_id", companyId)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (rightType) {
    query = query.in("right_type", [rightType, "all"]);
  }

  const { data } = await query;
  return (data ?? []) as ResponseTemplate[];
}

export async function getCompanyUsageThisMonth(companyId: string) {
  const supabase = await createSupabaseServerClient();
  const from = startOfMonth(new Date()).toISOString();
  const to = endOfMonth(new Date()).toISOString();

  const { count } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .gte("received_at", from)
    .lte("received_at", to);

  return count ?? 0;
}

export async function getDashboardStats(companyId: string) {
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const weekAhead = addDays(now, 7).toISOString();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();

  const [open, dueThisWeek, overdue, completedThisMonth] = await Promise.all([
    supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .in("status", ["open", "in_progress"]),
    supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .not("status", "in", '("completed","refused")')
      .lte("deadline_at", weekAhead),
    supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .not("status", "in", '("completed","refused")')
      .lt("deadline_at", now.toISOString()),
    supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "completed")
      .gte("completed_at", monthStart)
      .lte("completed_at", monthEnd),
  ]);

  return {
    openRequests: open.count ?? 0,
    dueThisWeek: dueThisWeek.count ?? 0,
    overdue: overdue.count ?? 0,
    completedThisMonth: completedThisMonth.count ?? 0,
  };
}

function withDeadlineStatus(requests: RequestRecord[]) {
  return requests.map((request) => ({
    ...request,
    deadlineStatus: getDeadlineStatus(
      new Date(request.extended_deadline_at ?? request.deadline_at),
    ),
  })) satisfies DeadlineAwareRequest[];
}

export async function getCompanyRequests(params: {
  companyId: string;
  status?: RequestStatus;
  page?: number;
  limit?: number;
}) {
  const supabase = await createSupabaseServerClient();
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("requests")
    .select("*", { count: "exact" })
    .eq("company_id", params.companyId)
    .order("deadline_at", { ascending: true })
    .range(from, to);

  if (params.status) {
    query = query.eq("status", params.status as RequestStatus);
  }

  const { data, count } = await query;

  return {
    requests: withDeadlineStatus((data ?? []) as RequestRecord[]),
    count: count ?? 0,
    page,
    limit,
  };
}

export async function getUpcomingDeadlines(companyId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("requests")
    .select("*")
    .eq("company_id", companyId)
    .not("status", "in", '("completed","refused")')
    .order("deadline_at", { ascending: true })
    .limit(5);

  return withDeadlineStatus((data ?? []) as RequestRecord[]);
}

export async function getRequestDetail(companyId: string, requestId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: request }, { data: auditEvents }] = await Promise.all([
    supabase
      .from("requests")
      .select("*")
      .eq("company_id", companyId)
      .eq("id", requestId)
      .single(),
    supabase
      .from("audit_events")
      .select("*")
      .eq("company_id", companyId)
      .eq("request_id", requestId)
      .order("created_at", { ascending: false }),
  ]);

  const typedRequest = request as RequestRecord | null;

  if (!typedRequest) {
    return null;
  }

  return {
    request: {
      ...typedRequest,
      deadlineStatus: getDeadlineStatus(
        new Date(typedRequest.extended_deadline_at ?? typedRequest.deadline_at),
      ),
    },
    auditEvents: (auditEvents ?? []) as AuditEvent[],
  };
}

export async function getCompanyAuditLog(companyId: string, filters?: {
  from?: string;
  to?: string;
  eventTypes?: AuditEventType[];
  actor?: string;
  requestId?: string;
}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("audit_events")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (filters?.from) {
    query = query.gte("created_at", filters.from);
  }

  if (filters?.to) {
    query = query.lte("created_at", filters.to);
  }

  if (filters?.eventTypes?.length) {
    query = query.in("event_type", filters.eventTypes as AuditEventType[]);
  }

  if (filters?.actor) {
    query = query.ilike("actor_email", `%${filters.actor}%`);
  }

  if (filters?.requestId) {
    query = query.eq("request_id", filters.requestId);
  }

  const { data } = await query;
  return (data ?? []) as AuditEvent[];
}

export async function requireCompanyData() {
  const authContext = await getAuthContext();

  if (!authContext?.company) {
    return null;
  }

  return authContext;
}
