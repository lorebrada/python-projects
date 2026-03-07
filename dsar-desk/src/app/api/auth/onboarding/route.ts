import { NextResponse } from "next/server";

import { getDemoStore } from "@/lib/demo-store";
import { createCompanyForSignedInUser } from "@/lib/company";
import { onboardingSchema } from "@/lib/dsar/schemas";
import { isDemoMode } from "@/lib/env";
import { getAuthContext } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const authContext = await getAuthContext();

    if (!authContext?.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = onboardingSchema.safeParse({
      company_name: body.company_name,
      country: body.country,
      domain: body.domain,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const company = isDemoMode()
      ? (() => {
          const store = getDemoStore();
          store.company = {
            ...store.company,
            name: parsed.data.company_name,
            country: parsed.data.country,
            domain: parsed.data.domain ?? null,
          };
          store.companies = [store.company];
          return store.company;
        })()
      : await createCompanyForSignedInUser({
          companyName: parsed.data.company_name,
          country: parsed.data.country,
          domain: parsed.data.domain,
        });

    return NextResponse.json({ company_id: company.id });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create company",
      },
      { status: 500 },
    );
  }
}
