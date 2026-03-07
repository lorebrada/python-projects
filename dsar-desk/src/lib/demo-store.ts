import "server-only";

import { randomUUID } from "node:crypto";
import { addDays, startOfMonth } from "date-fns";
import type { User } from "@supabase/supabase-js";

import { DEFAULT_TEMPLATES } from "@/lib/dsar/templates";
import { calculateDeadline, calculateExtendedDeadline, getDeadlineStatus } from "@/lib/dsar/deadline";
import type {
  AuditEvent,
  AuditEventType,
  Company,
  CompanyMember,
  PlanKey,
  Profile,
  RequestRecord,
  RequestStatus,
  ResponseTemplate,
  RightType,
  SubscriptionRecord,
} from "@/types";

type DemoStore = {
  user: User;
  company: Company;
  profile: Profile;
  companyMembers: CompanyMember[];
  requests: RequestRecord[];
  auditEvents: AuditEvent[];
  templates: ResponseTemplate[];
  subscriptions: SubscriptionRecord[];
  users: Profile[];
  companies: Company[];
};

declare global {
  var __DSAR_DESK_DEMO_STORE__: DemoStore | undefined;
}

const DEMO_USER_ID = "11111111-1111-4111-8111-111111111111";
const DEMO_COMPANY_ID = "22222222-2222-4222-8222-222222222222";
const DEMO_MEMBER_ID = "33333333-3333-4333-8333-333333333333";

function buildDemoUser() {
  return {
    id: DEMO_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "demo@dsardesk.test",
    email_confirmed_at: new Date().toISOString(),
    phone: "",
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {
      provider: "email",
      providers: ["email"],
    },
    user_metadata: {
      full_name: "Demo DPO",
    },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
  } as unknown as User;
}

function buildInitialStore(): DemoStore {
  const now = new Date();
  const company: Company = {
    id: DEMO_COMPANY_ID,
    owner_id: DEMO_USER_ID,
    name: "Acme Privacy GmbH",
    domain: "acmeprivacy.eu",
    dpo_email: "privacy@acmeprivacy.eu",
    dpo_name: "Demo DPO",
    country: "DE",
    intake_token: "demo-intake-token",
    intake_enabled: true,
    logo_url: null,
    created_at: addDays(now, -45).toISOString(),
  };

  const profile: Profile = {
    id: DEMO_USER_ID,
    email: "demo@dsardesk.test",
    full_name: "Demo DPO",
    plan: "team",
    stripe_customer_id: "cus_demo_123",
    current_company_id: company.id,
    created_at: addDays(now, -45).toISOString(),
    updated_at: now.toISOString(),
  };

  const requestOneReceived = addDays(now, -20);
  const requestTwoReceived = addDays(now, -8);
  const requestThreeReceived = addDays(now, -35);

  const requests: RequestRecord[] = [
    {
      id: "44444444-4444-4444-8444-444444444444",
      company_id: company.id,
      assigned_to: DEMO_USER_ID,
      requester_name: "Anna Rossi",
      requester_email: "anna.rossi@example.com",
      requester_ip: "127.0.0.1",
      right_type: "access",
      description: "Please send me a full copy of the data you hold about my account.",
      internal_notes: "Collect CRM exports and support tickets.",
      status: "in_progress",
      received_at: requestOneReceived.toISOString(),
      deadline_at: calculateDeadline(requestOneReceived).toISOString(),
      extended_deadline_at: null,
      completed_at: null,
      source: "manual",
      identity_verified: true,
      identity_method: "manual",
      created_at: requestOneReceived.toISOString(),
      updated_at: now.toISOString(),
    },
    {
      id: "55555555-5555-4555-8555-555555555555",
      company_id: company.id,
      assigned_to: DEMO_USER_ID,
      requester_name: "Pierre Martin",
      requester_email: "p.martin@example.fr",
      requester_ip: "127.0.0.1",
      right_type: "erasure",
      description: "Delete my marketing profile and unsubscribe all records.",
      internal_notes: "Check legal retention exception before final deletion.",
      status: "open",
      received_at: requestTwoReceived.toISOString(),
      deadline_at: calculateDeadline(requestTwoReceived).toISOString(),
      extended_deadline_at: null,
      completed_at: null,
      source: "intake_form",
      identity_verified: false,
      identity_method: null,
      created_at: requestTwoReceived.toISOString(),
      updated_at: now.toISOString(),
    },
    {
      id: "66666666-6666-4666-8666-666666666666",
      company_id: company.id,
      assigned_to: DEMO_USER_ID,
      requester_name: "Lena Schmidt",
      requester_email: "lena.schmidt@example.de",
      requester_ip: "127.0.0.1",
      right_type: "portability",
      description: "I want a machine-readable export of my account data.",
      internal_notes: "Marked overdue to show alerting behavior in demo.",
      status: "overdue",
      received_at: requestThreeReceived.toISOString(),
      deadline_at: calculateDeadline(requestThreeReceived).toISOString(),
      extended_deadline_at: null,
      completed_at: null,
      source: "manual",
      identity_verified: true,
      identity_method: "manual",
      created_at: requestThreeReceived.toISOString(),
      updated_at: now.toISOString(),
    },
  ];

  const templates: ResponseTemplate[] = DEFAULT_TEMPLATES.map((template) => ({
    ...template,
    id: randomUUID(),
    company_id: company.id,
    created_at: now.toISOString(),
  }));

  const companyMembers: CompanyMember[] = [
    {
      id: DEMO_MEMBER_ID,
      company_id: company.id,
      user_id: DEMO_USER_ID,
      role: "owner",
      invited_at: addDays(now, -45).toISOString(),
    },
  ];

  const auditEvents: AuditEvent[] = requests.flatMap((request) => [
    {
      id: randomUUID(),
      request_id: request.id,
      company_id: company.id,
      actor_id: DEMO_USER_ID,
      actor_email: profile.email,
      event_type: "request_received",
      details: {
        source: request.source,
      },
      ip_address: request.requester_ip,
      created_at: request.created_at,
    },
    {
      id: randomUUID(),
      request_id: request.id,
      company_id: company.id,
      actor_id: DEMO_USER_ID,
      actor_email: profile.email,
      event_type: "acknowledgment_sent",
      details: {
        to: request.requester_email,
      },
      ip_address: request.requester_ip,
      created_at: addDays(new Date(request.created_at), 1).toISOString(),
    },
  ]);

  return {
    user: buildDemoUser(),
    company,
    profile,
    companyMembers,
    requests,
    auditEvents,
    templates,
    subscriptions: [
      {
        id: randomUUID(),
        user_id: profile.id,
        stripe_subscription_id: "sub_demo_123",
        stripe_price_id: "price_demo_team",
        plan: "team",
        status: "active",
        current_period_end: addDays(now, 20).toISOString(),
        cancel_at_period_end: false,
        created_at: addDays(now, -45).toISOString(),
      },
    ],
    users: [profile],
    companies: [company],
  };
}

export function getDemoStore() {
  if (!globalThis.__DSAR_DESK_DEMO_STORE__) {
    globalThis.__DSAR_DESK_DEMO_STORE__ = buildInitialStore();
  }

  return globalThis.__DSAR_DESK_DEMO_STORE__;
}

export function getDemoAuthContext() {
  const store = getDemoStore();

  return {
    user: store.user,
    profile: store.profile,
    company: store.company,
  };
}

export function getDemoCompanyMembers(companyId: string) {
  const store = getDemoStore();
  return store.companyMembers
    .filter((member) => member.company_id === companyId)
    .map((member) => ({
      user_id: member.user_id,
      role: member.role,
      full_name: store.profile.full_name,
      email: store.profile.email,
    }));
}

export function getDemoTemplates(companyId: string, rightType?: string) {
  const store = getDemoStore();
  return store.templates.filter(
    (template) =>
      template.company_id === companyId &&
      (!rightType || template.right_type === "all" || template.right_type === rightType),
  );
}

export function getDemoUsageThisMonth(companyId: string) {
  const store = getDemoStore();
  const monthStart = startOfMonth(new Date());
  return store.requests.filter(
    (request) =>
      request.company_id === companyId &&
      new Date(request.received_at) >= monthStart,
  ).length;
}

export function getDemoDashboardStats(companyId: string) {
  const store = getDemoStore();
  const now = new Date();
  const weekAhead = addDays(now, 7);
  const requests = store.requests.filter((request) => request.company_id === companyId);

  return {
    openRequests: requests.filter((request) =>
      ["open", "in_progress"].includes(request.status),
    ).length,
    dueThisWeek: requests.filter((request) => {
      const deadline = new Date(request.extended_deadline_at ?? request.deadline_at);
      return !["completed", "refused"].includes(request.status) && deadline <= weekAhead;
    }).length,
    overdue: requests.filter((request) => {
      const deadline = new Date(request.extended_deadline_at ?? request.deadline_at);
      return !["completed", "refused"].includes(request.status) && deadline < now;
    }).length,
    completedThisMonth: requests.filter((request) => {
      return (
        request.status === "completed" &&
        request.completed_at &&
        new Date(request.completed_at) >= startOfMonth(now)
      );
    }).length,
  };
}

export function getDemoRequests(companyId: string, params?: {
  status?: RequestStatus;
  page?: number;
  limit?: number;
}) {
  const store = getDemoStore();
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const filtered = store.requests
    .filter((request) => request.company_id === companyId)
    .filter((request) => !params?.status || request.status === params.status)
    .sort(
      (a, b) =>
        new Date(a.extended_deadline_at ?? a.deadline_at).getTime() -
        new Date(b.extended_deadline_at ?? b.deadline_at).getTime(),
    );
  const requests = filtered.slice((page - 1) * limit, page * limit);

  return {
    requests: requests.map((request) => ({
      ...request,
      deadlineStatus: getDeadlineStatus(
        new Date(request.extended_deadline_at ?? request.deadline_at),
      ),
    })),
    count: filtered.length,
    page,
    limit,
  };
}

export function getDemoUpcomingDeadlines(companyId: string) {
  return getDemoRequests(companyId, { limit: 5 }).requests;
}

export function getDemoRequestDetail(companyId: string, requestId: string) {
  const store = getDemoStore();
  const request = store.requests.find(
    (item) => item.company_id === companyId && item.id === requestId,
  );

  if (!request) {
    return null;
  }

  return {
    request: {
      ...request,
      deadlineStatus: getDeadlineStatus(
        new Date(request.extended_deadline_at ?? request.deadline_at),
      ),
    },
    auditEvents: store.auditEvents
      .filter((event) => event.request_id === requestId)
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
  };
}

export function getDemoAuditLog(companyId: string, filters?: {
  from?: string;
  to?: string;
  eventTypes?: AuditEventType[];
  actor?: string;
  requestId?: string;
}) {
  const store = getDemoStore();
  return store.auditEvents
    .filter((event) => event.company_id === companyId)
    .filter((event) => !filters?.from || event.created_at >= filters.from)
    .filter((event) => !filters?.to || event.created_at <= filters.to)
    .filter((event) => !filters?.requestId || event.request_id === filters.requestId)
    .filter(
      (event) =>
        !filters?.eventTypes?.length || filters.eventTypes.includes(event.event_type),
    )
    .filter(
      (event) =>
        !filters?.actor ||
        (event.actor_email ?? "").toLowerCase().includes(filters.actor.toLowerCase()),
    )
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
}

export function getDemoCompanyByToken(token: string) {
  const store = getDemoStore();
  return store.companies.find((company) => company.intake_token === token) ?? null;
}

export function addDemoAuditEvent(params: {
  requestId: string;
  companyId: string;
  eventType: AuditEventType;
  details?: Record<string, unknown> | null;
}) {
  const store = getDemoStore();
  const event: AuditEvent = {
    id: randomUUID(),
    request_id: params.requestId,
    company_id: params.companyId,
    actor_id: store.user.id,
    actor_email: store.profile.email,
    event_type: params.eventType,
    details: params.details ?? null,
    ip_address: "127.0.0.1",
    created_at: new Date().toISOString(),
  };
  store.auditEvents.unshift(event);
  return event;
}

export function createDemoRequest(input: {
  company_id: string;
  right_type: RightType;
  requester_name: string;
  requester_email: string;
  description?: string | null;
  internal_notes?: string | null;
  received_at?: Date;
  source?: "manual" | "intake_form" | "email";
  assigned_to?: string | null;
  requester_ip?: string | null;
}) {
  const store = getDemoStore();
  const receivedAt = input.received_at ?? new Date();
  const request: RequestRecord = {
    id: randomUUID(),
    company_id: input.company_id,
    assigned_to: input.assigned_to ?? store.user.id,
    requester_name: input.requester_name,
    requester_email: input.requester_email,
    requester_ip: input.requester_ip ?? "127.0.0.1",
    right_type: input.right_type,
    description: input.description ?? null,
    internal_notes: input.internal_notes ?? null,
    status: "open",
    received_at: receivedAt.toISOString(),
    deadline_at: calculateDeadline(receivedAt).toISOString(),
    extended_deadline_at: null,
    completed_at: null,
    source: input.source ?? "manual",
    identity_verified: false,
    identity_method: null,
    created_at: receivedAt.toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.requests.unshift(request);
  addDemoAuditEvent({
    companyId: request.company_id,
    requestId: request.id,
    eventType: "request_received",
    details: {
      source: request.source,
      right_type: request.right_type,
    },
  });

  return request;
}

export function updateDemoRequest(
  companyId: string,
  requestId: string,
  updates: Partial<RequestRecord>,
) {
  const store = getDemoStore();
  const index = store.requests.findIndex(
    (request) => request.company_id === companyId && request.id === requestId,
  );

  if (index === -1) {
    return null;
  }

  const existing = store.requests[index];
  const nextStatus =
    updates.status === "extended"
      ? "extended"
      : updates.status === "completed"
        ? "completed"
        : updates.status ?? existing.status;

  const updated: RequestRecord = {
    ...existing,
    ...updates,
    status: nextStatus,
    extended_deadline_at:
      updates.status === "extended"
        ? calculateExtendedDeadline(new Date(existing.received_at)).toISOString()
        : updates.extended_deadline_at ?? existing.extended_deadline_at,
    completed_at:
      updates.status === "completed"
        ? new Date().toISOString()
        : updates.completed_at ?? existing.completed_at,
    updated_at: new Date().toISOString(),
  };

  store.requests[index] = updated;

  return {
    existing,
    updated,
  };
}

export function respondToDemoRequest(
  companyId: string,
  requestId: string,
  payload: {
    subject: string;
    body: string;
    sendEmail: boolean;
  },
) {
  const updated = updateDemoRequest(companyId, requestId, payload.sendEmail ? { status: "completed" } : {});

  if (!updated) {
    return null;
  }

  const event = addDemoAuditEvent({
    companyId,
    requestId,
    eventType: "response_sent",
    details: {
      subject: payload.subject,
      body: payload.body,
      sent: payload.sendEmail,
    },
  });

  return {
    request: updated.updated,
    auditEvent: event,
  };
}

export function submitDemoIntake(input: {
  token: string;
  right_type: RightType;
  requester_name: string;
  requester_email: string;
  description: string;
}) {
  const company = getDemoCompanyByToken(input.token);

  if (!company) {
    return null;
  }

  const request = createDemoRequest({
    company_id: company.id,
    right_type: input.right_type,
    requester_name: input.requester_name,
    requester_email: input.requester_email,
    description: input.description,
    source: "intake_form",
  });

  addDemoAuditEvent({
    companyId: company.id,
    requestId: request.id,
    eventType: "acknowledgment_sent",
    details: {
      to: request.requester_email,
    },
  });

  return request;
}

export function registerDemoUser(input: {
  full_name: string;
  email: string;
  company_name: string;
}) {
  const store = getDemoStore();
  store.profile = {
    ...store.profile,
    full_name: input.full_name,
    email: input.email,
    updated_at: new Date().toISOString(),
  };
  store.company = {
    ...store.company,
    name: input.company_name,
  };
  store.companies = [store.company];
  store.users = [store.profile];
  return {
    user_id: store.user.id,
    company_id: store.company.id,
  };
}

export function getDemoAdminOverview() {
  const store = getDemoStore();
  return {
    profiles: store.users,
    companies: store.companies,
    requests: store.requests,
  };
}

export function activateDemoPlan(plan: PlanKey) {
  const store = getDemoStore();
  store.profile.plan = plan;
  store.subscriptions[0] = {
    ...store.subscriptions[0],
    plan,
  };
}
