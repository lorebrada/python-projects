import { NextResponse } from "next/server";

import { createCompanyForSignedInUser } from "@/lib/company";
import { onboardingSchema } from "@/lib/dsar/schemas";
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

    const company = await createCompanyForSignedInUser({
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
