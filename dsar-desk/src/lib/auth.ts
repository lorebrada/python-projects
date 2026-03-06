import "server-only";

import type { User } from "@supabase/supabase-js";

import type { Company, Profile } from "@/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AuthContext {
  user: User;
  profile: Profile;
  company: Company | null;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const typedProfile = profile as Profile | null;

  if (!typedProfile) {
    return null;
  }

  let company: Company | null = null;

  if (typedProfile.current_company_id) {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("id", typedProfile.current_company_id)
      .single();

    company = (data as Company | null) ?? null;
  }

  if (!company) {
    const { data: ownedCompany } = await supabase
      .from("companies")
      .select("*")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    company = (ownedCompany as Company | null) ?? null;
  }

  if (!company) {
    const { data: memberships } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .limit(1);

    const companyId = (memberships as Array<{ company_id: string }> | null)?.[0]?.company_id;

    if (companyId) {
      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .maybeSingle();

      company = (data as Company | null) ?? null;
    }
  }

  if (company && typedProfile.current_company_id !== company.id) {
    await supabase
      .from("profiles")
      .update({ current_company_id: company.id })
      .eq("id", typedProfile.id);
  }

  return {
    user: user as User,
    profile: {
      ...typedProfile,
      current_company_id: company?.id ?? typedProfile.current_company_id,
    },
    company,
  };
}

export async function requireAuthContext() {
  const authContext = await getAuthContext();

  if (!authContext) {
    throw new Error("Unauthenticated");
  }

  return authContext;
}
