import "server-only";

import type { ReactElement } from "react";

import { Resend } from "resend";

import { isResendConfigured, requireEnv } from "@/lib/env";

let resend: Resend | null = null;

function getResendClient() {
  if (!resend) {
    resend = new Resend(requireEnv("RESEND_API_KEY"));
  }

  return resend;
}

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  react?: ReactElement;
  html?: string;
  text?: string;
  from?: string;
}) {
  if (!isResendConfigured()) {
    return { skipped: true };
  }

  return getResendClient().emails.send({
    from: params.from ?? requireEnv("RESEND_FROM_EMAIL"),
    to: params.to,
    subject: params.subject,
    react: params.react,
    html: params.html,
    text: params.text,
  });
}
