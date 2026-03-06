export type RequiredServerVar =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "STRIPE_SECRET_KEY"
  | "STRIPE_WEBHOOK_SECRET"
  | "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  | "RESEND_API_KEY"
  | "RESEND_FROM_EMAIL"
  | "NEXT_PUBLIC_APP_URL"
  | "CRON_SECRET";

export function getEnv(key: string, fallback = "") {
  return process.env[key] ?? fallback;
}

export function requireEnv(key: RequiredServerVar) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  );
}

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export function getAdminEmails() {
  return getEnv("ADMIN_EMAILS")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getAppUrl() {
  return getEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
}

export function getStripePriceIds() {
  return {
    solo: getEnv("STRIPE_PRICE_SOLO_MONTHLY"),
    team: getEnv("STRIPE_PRICE_TEAM_MONTHLY"),
    agency: getEnv("STRIPE_PRICE_AGENCY_MONTHLY"),
  };
}
