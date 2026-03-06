import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { AuditEventType } from "@/types";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;

export async function logAuditEvent(
  client: TypedSupabaseClient,
  params: {
    requestId: string;
    companyId: string;
    eventType: AuditEventType;
    actor?: Pick<User, "id" | "email"> | null;
    details?: Record<string, unknown> | null;
    ipAddress?: string | null;
  },
) {
  const { data, error } = await client
    .from("audit_events")
    .insert({
      request_id: params.requestId,
      company_id: params.companyId,
      actor_id: params.actor?.id ?? null,
      actor_email: params.actor?.email ?? null,
      event_type: params.eventType,
      details: (params.details ?? null) as Database["public"]["Tables"]["audit_events"]["Insert"]["details"],
      ip_address: params.ipAddress ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
