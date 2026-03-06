import Link from "next/link";

import { DeadlineCountdown } from "@/components/dashboard/DeadlineCountdown";
import { RightTypeBadge } from "@/components/requests/RightTypeBadge";
import { RequestStatusBadge } from "@/components/requests/RequestStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { DeadlineAwareRequest } from "@/types";

export function RequestTable({
  requests,
}: {
  requests: DeadlineAwareRequest[];
}) {
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Requester</TableHead>
            <TableHead>Right</TableHead>
            <TableHead>Received</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                No requests match this view yet.
              </TableCell>
            </TableRow>
          ) : (
            requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="font-medium">{request.requester_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {request.requester_email}
                  </div>
                </TableCell>
                <TableCell>
                  <RightTypeBadge rightType={request.right_type} />
                </TableCell>
                <TableCell>{formatDate(request.received_at)}</TableCell>
                <TableCell>
                  <DeadlineCountdown
                    overdueEmphasis
                    status={request.deadlineStatus}
                  />
                </TableCell>
                <TableCell>
                  <RequestStatusBadge status={request.status} />
                </TableCell>
                <TableCell>{request.assigned_to ?? "Unassigned"}</TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/requests/${request.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
