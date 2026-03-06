import { NextResponse } from "next/server";
import { createElement } from "react";

import WelcomeEmail from "@/components/emails/WelcomeEmail";
import { createAccountWithCompany } from "@/lib/company";
import { registerSchema } from "@/lib/dsar/schemas";
import { getAppUrl } from "@/lib/env";
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

    const result = await createAccountWithCompany({
      email: parsed.data.email,
      password: parsed.data.password,
      fullName: parsed.data.full_name,
      companyName: parsed.data.company_name,
      country: "IT",
    });

    const appUrl = getAppUrl();

    await sendEmail({
      to: parsed.data.email,
      subject: "Welcome to DSAR Desk - you're set up in minutes",
      react: createElement(WelcomeEmail, {
        company_name: result.company.name,
        dashboard_url: `${appUrl}/dashboard`,
        intake_url: `${appUrl}/intake/${result.company.intake_token}`,
        name: parsed.data.full_name,
      }),
    });

    return NextResponse.json({
      user_id: result.user.id,
      company_id: result.company.id,
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
