export type PlanKey = "solo" | "team" | "agency";

export type RightType =
  | "access"
  | "erasure"
  | "portability"
  | "rectification"
  | "restriction"
  | "objection";

export type TemplateRightType = RightType | "all";

export type RequestStatus =
  | "open"
  | "in_progress"
  | "awaiting_verification"
  | "completed"
  | "extended"
  | "refused"
  | "overdue";

export type RequestSource = "manual" | "intake_form" | "email";

export type CompanyMemberRole = "owner" | "admin" | "member";

export type AuditEventType =
  | "request_received"
  | "request_assigned"
  | "status_changed"
  | "acknowledgment_sent"
  | "response_sent"
  | "deadline_extended"
  | "identity_verified"
  | "request_refused"
  | "note_added"
  | "deadline_alert_sent"
  | "intake_form_submitted";

export interface Company {
  id: string;
  owner_id: string | null;
  name: string;
  domain: string | null;
  dpo_email: string | null;
  dpo_name: string | null;
  country: string;
  intake_token: string;
  intake_enabled: boolean;
  logo_url: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  plan: PlanKey;
  stripe_customer_id: string | null;
  current_company_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: CompanyMemberRole;
  invited_at: string;
}

export interface RequestRecord {
  id: string;
  company_id: string;
  assigned_to: string | null;
  requester_name: string;
  requester_email: string;
  requester_ip: string | null;
  right_type: RightType;
  description: string | null;
  internal_notes: string | null;
  status: RequestStatus;
  received_at: string;
  deadline_at: string;
  extended_deadline_at: string | null;
  completed_at: string | null;
  source: RequestSource;
  identity_verified: boolean;
  identity_method: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditEvent {
  id: string;
  request_id: string;
  company_id: string | null;
  actor_id: string | null;
  actor_email: string | null;
  event_type: AuditEventType;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface ResponseTemplate {
  id?: string;
  company_id?: string | null;
  right_type: TemplateRightType;
  name: string;
  subject: string;
  body: string;
  language: string;
  is_default: boolean;
  created_at?: string;
}

export interface SubscriptionRecord {
  id: string;
  user_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan: PlanKey;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
}

export interface CompanyContext {
  company: Company;
  profile: Profile;
  isOwner: boolean;
}

export interface DeadlineAwareRequest extends RequestRecord {
  deadlineStatus: import("@/lib/dsar/deadline").DeadlineStatus;
}
