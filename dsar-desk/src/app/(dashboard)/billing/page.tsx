import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLANS } from "@/lib/stripe/plans";
import { formatCurrency } from "@/lib/utils";
import { getCompanyUsageThisMonth, requireCompanyData } from "@/lib/server-data";

export default async function BillingPage() {
  const authContext = await requireCompanyData();

  if (!authContext?.company) {
    return null;
  }

  const usage = await getCompanyUsageThisMonth(authContext.company.id);
  const currentPlan = PLANS[authContext.profile.plan];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Billing"
        title="Subscription and usage"
        description="Review current limits, compare plans, and launch Stripe checkout or the billing portal."
      />
      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-2xl font-semibold">{currentPlan.name}</p>
          <p>
            {formatCurrency(currentPlan.price)} / month
          </p>
          <ul className="space-y-1 text-muted-foreground">
            {currentPlan.features.map((feature) => (
              <li key={feature}>• {feature}</li>
            ))}
          </ul>
          <p className="text-muted-foreground">
            Usage this month:{" "}
            {Number.isFinite(currentPlan.maxRequests)
              ? `${usage} / ${currentPlan.maxRequests}`
              : "Unlimited"}
          </p>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-3">
        {Object.values(PLANS).map((plan) => (
          <Card key={plan.key}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-3xl font-semibold">{formatCurrency(plan.price)}</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              {plan.key !== authContext.profile.plan ? (
                <Button asChild className="w-full">
                  <a href={`/api/stripe/checkout?plan=${plan.key}`}>Upgrade</a>
                </Button>
              ) : (
                <Button className="w-full" disabled variant="outline">
                  Current plan
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <Button asChild variant="outline">
        <a href="/api/stripe/portal">Manage subscription</a>
      </Button>
    </div>
  );
}
