import { forbidden } from "next/navigation";
import { startOfMonth } from "date-fns";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuthContext } from "@/lib/auth";
import { getDemoAdminOverview } from "@/lib/demo-store";
import { getAdminEmails } from "@/lib/env";
import { isDemoMode } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Company, Profile, RequestRecord } from "@/types";

export default async function AdminPage() {
  const authContext = await getAuthContext();

  if (!authContext?.user.email || !getAdminEmails().includes(authContext.user.email.toLowerCase())) {
    forbidden();
  }

  const monthStart = startOfMonth(new Date()).toISOString();
  const demoOverview = isDemoMode() ? getDemoAdminOverview() : null;
  const admin = isDemoMode() ? null : createSupabaseAdminClient();

  const [{ data: profiles }, { data: companies }, { data: requests }] = isDemoMode()
    ? [
        { data: demoOverview?.profiles ?? [] },
        { data: demoOverview?.companies ?? [] },
        { data: demoOverview?.requests ?? [] },
      ]
    : await Promise.all([
        admin!.from("profiles").select("*").order("created_at", { ascending: false }),
        admin!.from("companies").select("*"),
        admin!.from("requests").select("*"),
      ]);
  const typedProfiles = (profiles ?? []) as Profile[];
  const typedCompanies = (companies ?? []) as Company[];
  const typedRequests = (requests ?? []) as RequestRecord[];

  const companyMap = new Map(typedCompanies.map((company) => [company.id, company]));
  const requestsByCompany = new Map<string, number>();
  const overdueRequests =
    typedRequests.filter(
      (request) => request.status !== "completed" && new Date(request.deadline_at) < new Date(),
    ).length;

  for (const request of typedRequests) {
    if (new Date(request.received_at) >= new Date(monthStart)) {
      requestsByCompany.set(
        request.company_id,
        (requestsByCompany.get(request.company_id) ?? 0) + 1,
      );
    }
  }

  const paidUsers = typedProfiles.filter((profile) => profile.plan !== "solo").length;
  const mrr =
    typedProfiles.reduce((sum, profile) => {
      if (profile.plan === "team") return sum + 39;
      if (profile.plan === "agency") return sum + 99;
      return sum + 15;
    }, 0);

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <PageHeader
        eyebrow="Admin"
        title="Workspace metrics"
        description="Monitor total users, revenue, request load, and account activity."
      />
      <div className="grid gap-4 md:grid-cols-5">
        {[
          ["Total users", typedProfiles.length],
          ["Paid users", paidUsers],
          ["MRR", formatCurrency(mrr)],
          ["Total requests", typedRequests.length],
          ["Overdue requests", overdueRequests],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="space-y-2 p-6">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-3xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Requests this month</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {typedProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell className="capitalize">{profile.plan}</TableCell>
                  <TableCell>
                    {profile.current_company_id
                      ? companyMap.get(profile.current_company_id)?.name ?? "—"
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {profile.current_company_id
                      ? requestsByCompany.get(profile.current_company_id) ?? 0
                      : 0}
                  </TableCell>
                  <TableCell>{formatDate(profile.created_at)}</TableCell>
                  <TableCell>
                    <Button disabled size="sm" variant="outline">
                      Impersonate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
