import { NextResponse } from "next/server";
import { createElement } from "react";

import WelcomeEmail from "@/components/emails/WelcomeEmail";
import { registerDemoUser } from "@/lib/demo-store";
import { createAccountWithCompany } from "@/lib/company";
import { registerSchema } from "@/lib/dsar/schemas";
import { getAppUrl } from "@/lib/env";
import { isDemoMode } from "@/lib/env";
import { sendEmail } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = isDemoMode()
      ? {
          userId: registerDemoUser({
            full_name: parsed.data.full_name,
            email: parsed.data.email,
            company_name: parsed.data.company_name,
          }).user_id,
          companyId: "demo-company",
          companyName: parsed.data.company_name,
          intakeToken: "demo-intake-token",
        }
      : await createAccountWithCompany({
          email: parsed.data.email,
          password: parsed.data.password,
          fullName: parsed.data.full_name,
          companyName: parsed.data.company_name,
          country: "IT",
        }).then((created) => ({
          userId: created.user.id,
          companyId: created.company.id,
          companyName: created.company.name,
          intakeToken: created.company.intake_token,
        }));

    const appUrl = getAppUrl();

    await sendEmail({
      to: parsed.data.email,
      subject: "Welcome to DSAR Desk - you're set up in minutes",
      react: createElement(WelcomeEmail, {
        company_name: result.companyName,
        dashboard_url: `${appUrl}/dashboard`,
        intake_url: `${appUrl}/intake/${result.intakeToken}`,
        name: parsed.data.full_name,
      }),
    });

    return NextResponse.json({
      user_id: result.userId,
      company_id: result.companyId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create account",
      },
      { status: 500 },
    );
  }
}
