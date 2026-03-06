import Link from "next/link";

import { RequestTable } from "@/components/dashboard/RequestTable";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { DeadlineCountdown } from "@/components/dashboard/DeadlineCountdown";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCompanyData } from "@/lib/server-data";
import {
  getCompanyRequests,
  getCompanyUsageThisMonth,
  getDashboardStats,
  getUpcomingDeadlines,
} from "@/lib/server-data";
import { PLANS } from "@/lib/stripe/plans";

export default async function DashboardPage() {
  const authContext = await requireCompanyData();

  if (!authContext?.company) {
    return null;
  }

  const [stats, requestResult, upcomingDeadlines, usageThisMonth] =
    await Promise.all([
      getDashboardStats(authContext.company.id),
      getCompanyRequests({
        companyId: authContext.company.id,
        limit: 20,
      }),
      getUpcomingDeadlines(authContext.company.id),
      getCompanyUsageThisMonth(authContext.company.id),
    ]);

  const openRequests = requestResult.requests.filter((request) =>
    ["open", "in_progress"].includes(request.status),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dashboard"
        title="DSAR operations overview"
        description="Track the requests that need attention now, review upcoming deadlines, and monitor monthly plan usage."
        action={
          <Button asChild>
            <Link href="/requests/new">Log new request</Link>
          </Button>
        }
      />

      <StatsBar stats={stats} />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Open and in-progress requests</h2>
          <RequestTable requests={openRequests} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming deadlines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingDeadlines.map((request) => (
                <div key={request.id} className="space-y-1 rounded-xl border p-3">
                  <p className="font-medium">{request.requester_name}</p>
                  <p className="text-xs text-muted-foreground">{request.requester_email}</p>
                  <DeadlineCountdown status={request.deadlineStatus} />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/requests/new">Log new request</Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/audit-log">Review audit log</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Plan usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {authContext.profile.plan === "solo" ? (
                <p>
                  {usageThisMonth} / {PLANS.solo.maxRequests} requests this month
                </p>
              ) : (
                <p>Unlimited requests on the {authContext.profile.plan} plan</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
