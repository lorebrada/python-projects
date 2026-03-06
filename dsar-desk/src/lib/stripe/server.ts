import "server-only";

import Stripe from "stripe";

import { requireEnv } from "@/lib/env";

let stripe: Stripe | null = null;

export function getStripeServerClient() {
  if (!stripe) {
    stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
      apiVersion: "2026-02-25.clover",
      appInfo: {
        name: "DSAR Desk",
      },
    });
  }

  return stripe;
}
