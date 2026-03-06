"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { DeadlineCountdown } from "@/components/dashboard/DeadlineCountdown";
import { ResponseComposer } from "@/components/requests/ResponseComposer";
import { RequestStatusBadge } from "@/components/requests/RequestStatusBadge";
import { RightTypeBadge } from "@/components/requests/RightTypeBadge";
import { PlanGate } from "@/components/shared/PlanGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { GDPR_RIGHT_REFERENCES } from "@/lib/dsar/reference";
import { formatDate, formatDateTime } from "@/lib/utils";
import type {
  AuditEvent,
  Company,
  DeadlineAwareRequest,
  PlanKey,
  ResponseTemplate,
} from "@/types";

interface RequestDetailShellProps {
  request: DeadlineAwareRequest;
  auditEvents: AuditEvent[];
  templates: ResponseTemplate[];
  members: Array<{ user_id: string; email: string; full_name: string | null }>;
  company: Company;
  currentPlan: PlanKey;
}

const statusOptions: DeadlineAwareRequest["status"][] = [
  "open",
  "in_progress",
  "awaiting_verification",
  "completed",
  "extended",
  "refused",
  "overdue",
];

export function RequestDetailShell({
  request,
  auditEvents,
  templates,
  members,
  company,
  currentPlan,
}: RequestDetailShellProps) {
  const [status, setStatus] = useState(request.status);
  const [assignedTo, setAssignedTo] = useState(request.assigned_to ?? "unassigned");
  const [internalNotes, setInternalNotes] = useState(request.internal_notes ?? "");
  const [identityVerified, setIdentityVerified] = useState(request.identity_verified);
  const [saving, setSaving] = useState(false);

  const gdprReference = GDPR_RIGHT_REFERENCES[request.right_type];

  async function savePatch(extra?: Record<string, unknown>) {
    setSaving(true);

    try {
      const response = await fetch(`/api/requests/${request.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          assigned_to: assignedTo === "unassigned" ? null : assignedTo,
          internal_notes: internalNotes,
          identity_verified: identityVerified,
          identity_method: identityVerified ? "manual" : null,
          ...extra,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update request");
      }

      toast.success("Request updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update request");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {request.requester_name}
            </h1>
            <RightTypeBadge rightType={request.right_type} />
            <RequestStatusBadge status={status} />
          </div>
          <p className="text-muted-foreground">{request.requester_email}</p>
          <div
            className={`rounded-2xl border p-4 ${request.deadlineStatus.color.replace("text-", "border-")}`}
          >
            <p className="text-sm font-medium">Deadline banner</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">
                  {request.deadlineStatus.isOverdue
                    ? `OVERDUE - Response was due ${Math.abs(request.deadlineStatus.daysRemaining)} days ago`
                    : `Deadline in ${request.deadlineStatus.daysRemaining} days - ${formatDate(
                        request.extended_deadline_at ?? request.deadline_at,
                      )}`}
                </p>
              </div>
              <DeadlineCountdown overdueEmphasis status={request.deadlineStatus} />
            </div>
          </div>
        </div>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="respond">Respond</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>
          <TabsContent className="space-y-4 pt-4" value="details">
            <Card>
              <CardContent className="grid gap-4 p-6">
                <div className="grid gap-1">
                  <p className="text-sm font-medium text-muted-foreground">Received</p>
                  <p>{formatDateTime(request.received_at)}</p>
                </div>
                <div className="grid gap-1">
                  <p className="text-sm font-medium text-muted-foreground">Source</p>
                  <p className="capitalize">{request.source.replace("_", " ")}</p>
                </div>
                <div className="grid gap-1">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="whitespace-pre-wrap">{request.description ?? "No description provided."}</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="internal_notes">Internal notes</Label>
                  <Textarea
                    id="internal_notes"
                    rows={6}
                    value={internalNotes}
                    onChange={(event) => setInternalNotes(event.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="font-medium">Identity verified</p>
                    <p className="text-sm text-muted-foreground">
                      Toggle after you have completed requester verification.
                    </p>
                  </div>
                  <Switch checked={identityVerified} onCheckedChange={setIdentityVerified} />
                </div>
                <div>
                  <Button disabled={saving} onClick={() => void savePatch()} type="button">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                    Save details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent className="space-y-4 pt-4" value="respond">
            <ResponseComposer company={company} request={request} templates={templates} />
          </TabsContent>
          <TabsContent className="space-y-4 pt-4" value="audit">
            <PlanGate
              currentPlan={currentPlan}
              minimumPlan="team"
              title="PDF audit export"
              description="Team and Agency plans can export full audit trail PDFs for regulators or auditors."
            >
              <Button asChild variant="outline">
                <a href={`/api/audit-log/export?format=pdf&requestId=${request.id}`}>
                  Export audit trail PDF
                </a>
              </Button>
            </PlanGate>
            <div className="space-y-3">
              {auditEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="space-y-2 p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium">{event.event_type.replaceAll("_", " ")}</p>
                      <p className="text-muted-foreground">
                        {formatDateTime(event.created_at)}
                      </p>
                    </div>
                    <p className="text-muted-foreground">
                      Actor: {event.actor_email ?? "System"}
                    </p>
                    {event.details ? (
                      <pre className="overflow-x-auto rounded-lg bg-muted p-3 whitespace-pre-wrap">
                        {JSON.stringify(event.details, null, 2)}
                      </pre>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Status & assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select onValueChange={(value) => setStatus(value as typeof status)} value={status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Assigned to</Label>
              <Select onValueChange={setAssignedTo} value={assignedTo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.full_name ?? member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" disabled={saving} onClick={() => void savePatch()} type="button">
              Save changes
            </Button>
            <Button
              className="w-full"
              disabled={saving}
              onClick={() => {
                setStatus("extended");
                void savePatch({ status: "extended" });
              }}
              type="button"
              variant="outline"
            >
              Extend deadline
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>GDPR reference</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              {gdprReference.article} - {format(new Date(request.received_at), "yyyy")}
            </p>
            <p>{gdprReference.summary}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <a className="block text-violet-700 underline" href={`mailto:${request.requester_email}`}>
              Email requester
            </a>
            <Button
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(request.id);
                toast.success("Copied request ID");
              }}
              type="button"
              variant="outline"
            >
              <Copy className="size-4" />
              Copy request ID
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
