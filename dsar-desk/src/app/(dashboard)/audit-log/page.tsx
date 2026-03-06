import { PageHeader } from "@/components/shared/PageHeader";
import { PlanGate } from "@/components/shared/PlanGate";
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
import { formatDateTime } from "@/lib/utils";
import { getCompanyAuditLog, requireCompanyData } from "@/lib/server-data";

export default async function AuditLogPage() {
  const authContext = await requireCompanyData();

  if (!authContext?.company) {
    return null;
  }

  const events = await getCompanyAuditLog(authContext.company.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Audit log"
        title="Company audit trail"
        description="A chronological log of all DSAR activity across your company workspace."
        action={
          <div className="flex gap-3">
            <PlanGate
              currentPlan={authContext.profile.plan}
              minimumPlan="team"
              title="PDF export"
              description="Upgrade to Team to export audit logs as PDF."
            >
              <Button asChild variant="outline">
                <a href="/api/audit-log/export?format=pdf">Export to PDF</a>
              </Button>
            </PlanGate>
            <Button asChild variant="outline">
              <a href="/api/audit-log/export?format=csv">Export to CSV</a>
            </Button>
          </div>
        }
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/time</TableHead>
                <TableHead>Request ID</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{formatDateTime(event.created_at)}</TableCell>
                  <TableCell>{event.request_id}</TableCell>
                  <TableCell>{event.event_type}</TableCell>
                  <TableCell>{event.actor_email ?? "System"}</TableCell>
                  <TableCell className="max-w-lg whitespace-pre-wrap text-xs text-muted-foreground">
                    {event.details ? JSON.stringify(event.details) : "—"}
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
