import type {
  AuditEventType,
  CompanyMemberRole,
  PlanKey,
  RequestSource,
  RequestStatus,
  RightType,
  TemplateRightType,
} from "@/types";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      companies: TableDef<
        {
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
        },
        {
          id?: string;
          owner_id?: string | null;
          name: string;
          domain?: string | null;
          dpo_email?: string | null;
          dpo_name?: string | null;
          country?: string;
          intake_token?: string;
          intake_enabled?: boolean;
          logo_url?: string | null;
          created_at?: string;
        },
        {
          id?: string;
          owner_id?: string | null;
          name?: string;
          domain?: string | null;
          dpo_email?: string | null;
          dpo_name?: string | null;
          country?: string;
          intake_token?: string;
          intake_enabled?: boolean;
          logo_url?: string | null;
          created_at?: string;
        }
      >;
      profiles: TableDef<
        {
          id: string;
          email: string;
          full_name: string | null;
          plan: PlanKey;
          stripe_customer_id: string | null;
          current_company_id: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          email: string;
          full_name?: string | null;
          plan?: PlanKey;
          stripe_customer_id?: string | null;
          current_company_id?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          email?: string;
          full_name?: string | null;
          plan?: PlanKey;
          stripe_customer_id?: string | null;
          current_company_id?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      company_members: TableDef<
        {
          id: string;
          company_id: string;
          user_id: string;
          role: CompanyMemberRole;
          invited_at: string;
        },
        {
          id?: string;
          company_id: string;
          user_id: string;
          role?: CompanyMemberRole;
          invited_at?: string;
        },
        {
          id?: string;
          company_id?: string;
          user_id?: string;
          role?: CompanyMemberRole;
          invited_at?: string;
        }
      >;
      requests: TableDef<
        {
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
        },
        {
          id?: string;
          company_id: string;
          assigned_to?: string | null;
          requester_name: string;
          requester_email: string;
          requester_ip?: string | null;
          right_type: RightType;
          description?: string | null;
          internal_notes?: string | null;
          status?: RequestStatus;
          received_at?: string;
          deadline_at: string;
          extended_deadline_at?: string | null;
          completed_at?: string | null;
          source?: RequestSource;
          identity_verified?: boolean;
          identity_method?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          company_id?: string;
          assigned_to?: string | null;
          requester_name?: string;
          requester_email?: string;
          requester_ip?: string | null;
          right_type?: RightType;
          description?: string | null;
          internal_notes?: string | null;
          status?: RequestStatus;
          received_at?: string;
          deadline_at?: string;
          extended_deadline_at?: string | null;
          completed_at?: string | null;
          source?: RequestSource;
          identity_verified?: boolean;
          identity_method?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      audit_events: TableDef<
        {
          id: string;
          request_id: string;
          company_id: string | null;
          actor_id: string | null;
          actor_email: string | null;
          event_type: AuditEventType;
          details: Json | null;
          ip_address: string | null;
          created_at: string;
        },
        {
          id?: string;
          request_id: string;
          company_id?: string | null;
          actor_id?: string | null;
          actor_email?: string | null;
          event_type: AuditEventType;
          details?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        },
        {
          id?: string;
          request_id?: string;
          company_id?: string | null;
          actor_id?: string | null;
          actor_email?: string | null;
          event_type?: AuditEventType;
          details?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        }
      >;
      templates: TableDef<
        {
          id: string;
          company_id: string | null;
          right_type: TemplateRightType;
          name: string;
          subject: string;
          body: string;
          language: string;
          is_default: boolean;
          created_at: string;
        },
        {
          id?: string;
          company_id?: string | null;
          right_type: TemplateRightType;
          name: string;
          subject: string;
          body: string;
          language?: string;
          is_default?: boolean;
          created_at?: string;
        },
        {
          id?: string;
          company_id?: string | null;
          right_type?: TemplateRightType;
          name?: string;
          subject?: string;
          body?: string;
          language?: string;
          is_default?: boolean;
          created_at?: string;
        }
      >;
      subscriptions: TableDef<
        {
          id: string;
          user_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          plan: PlanKey;
          status: string;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
        },
        {
          id?: string;
          user_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          plan: PlanKey;
          status: string;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
        },
        {
          id?: string;
          user_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          plan?: PlanKey;
          status?: string;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
