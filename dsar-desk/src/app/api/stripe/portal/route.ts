import { NextResponse } from "next/server";

import { getAuthContext } from "@/lib/auth";
import { getAppUrl, isDemoMode } from "@/lib/env";
import { getStripeServerClient } from "@/lib/stripe/server";

export async function GET() {
  try {
    const authContext = await getAuthContext();

    if (isDemoMode()) {
      return NextResponse.redirect(`${getAppUrl()}/billing?portal=demo`);
    }

    if (!authContext?.profile.stripe_customer_id) {
      return NextResponse.redirect(`${getAppUrl()}/billing`);
    }

    const stripe = getStripeServerClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: authContext.profile.stripe_customer_id,
      return_url: `${getAppUrl()}/billing`,
    });

    return NextResponse.redirect(session.url);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create billing portal session",
      },
      { status: 500 },
    );
  }
}
