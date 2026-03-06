import type { PlanKey } from "@/types";
import { getStripePriceIds } from "@/lib/env";

const stripePriceIds = getStripePriceIds();

export const PLANS = {
  solo: {
    key: "solo",
    name: "Solo",
    price: 15,
    currency: "eur",
    stripePriceId: stripePriceIds.solo,
    maxRequests: 20,
    maxUsers: 1,
    maxCompanies: 1,
    features: [
      "20 requests/mo",
      "1 user",
      "Intake form",
      "All response templates",
      "Email alerts",
    ],
  },
  team: {
    key: "team",
    name: "Team",
    price: 39,
    currency: "eur",
    stripePriceId: stripePriceIds.team,
    maxRequests: Number.POSITIVE_INFINITY,
    maxUsers: 5,
    maxCompanies: 1,
    features: [
      "Unlimited requests",
      "5 users",
      "Audit log PDF export",
      "Request assignment",
      "Priority support",
    ],
  },
  agency: {
    key: "agency",
    name: "Agency",
    price: 99,
    currency: "eur",
    stripePriceId: stripePriceIds.agency,
    maxRequests: Number.POSITIVE_INFINITY,
    maxUsers: Number.POSITIVE_INFINITY,
    maxCompanies: 10,
    features: [
      "10 client companies",
      "Unlimited everything",
      "White-label intake forms",
      "API access",
    ],
  },
} satisfies Record<
  PlanKey,
  {
    key: PlanKey;
    name: string;
    price: number;
    currency: string;
    stripePriceId: string;
    maxRequests: number;
    maxUsers: number;
    maxCompanies: number;
    features: string[];
  }
>;

export function getPlanByPriceId(priceId?: string | null) {
  return (Object.values(PLANS).find((plan) => plan.stripePriceId === priceId) ??
    PLANS.solo) as (typeof PLANS)[PlanKey];
}
