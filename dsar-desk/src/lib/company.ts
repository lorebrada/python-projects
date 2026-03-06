import "server-only";

import type { User } from "@supabase/supabase-js";

import { DEFAULT_TEMPLATES } from "@/lib/dsar/templates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Company } from "@/types";
import type { Database } from "@/types/database";

export async function seedDefaultTemplates(companyId: string) {
  const admin = createSupabaseAdminClient();

  const templates = DEFAULT_TEMPLATES.map((template) => ({
    ...template,
    company_id: companyId,
  }));

  const { error } = await admin
    .from("templates")
    .insert(
      templates as Database["public"]["Tables"]["templates"]["Insert"][],
    );

  if (error) {
    throw error;
  }
}

export async function createCompanyForExistingUser(params: {
  userId: string;
  companyName: string;
  country?: string;
  domain?: string | null;
}) {
  const admin = createSupabaseAdminClient();

  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({
      owner_id: params.userId,
      name: params.companyName,
      country: params.country ?? "IT",
      domain: params.domain ?? null,
    })
    .select("*")
    .single();
  const typedCompany = company as Company | null;

  if (companyError || !typedCompany) {
    throw companyError;
  }

  const { error: membershipError } = await admin.from("company_members").insert({
    company_id: typedCompany.id,
    user_id: params.userId,
    role: "owner",
  });

  if (membershipError) {
    throw membershipError;
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ current_company_id: typedCompany.id })
    .eq("id", params.userId);

  if (profileError) {
    throw profileError;
  }

  await seedDefaultTemplates(typedCompany.id);

  return typedCompany;
}

export async function createCompanyForSignedInUser(params: {
  companyName: string;
  country?: string;
  domain?: string | null;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthenticated");
  }

  return createCompanyForExistingUser({
    userId: user.id,
    companyName: params.companyName,
    country: params.country,
    domain: params.domain,
  });
}

export async function createAccountWithCompany(params: {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  country?: string;
}) {
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    user_metadata: {
      full_name: params.fullName,
    },
  });

  if (error || !data.user) {
    throw error ?? new Error("Unable to create user");
  }

  const company = await createCompanyForExistingUser({
    userId: data.user.id,
    companyName: params.companyName,
    country: params.country,
  });

  return {
    user: data.user as User,
    company,
  };
}
