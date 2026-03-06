"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RIGHT_TYPE_DESCRIPTIONS, RIGHT_TYPE_LABELS } from "@/lib/dsar/reference";
import { requestCreateSchema } from "@/lib/dsar/schemas";
import { calculateDeadline } from "@/lib/dsar/deadline";
import type { PlanKey, RightType } from "@/types";

type RequestFormValues = z.input<typeof requestCreateSchema>;

interface RequestFormProps {
  companyId: string;
  members: Array<{ user_id: string; email: string; full_name: string | null }>;
  currentPlan: PlanKey;
}

const defaultValues: Partial<RequestFormValues> = {
  requester_name: "",
  requester_email: "",
  description: "",
  internal_notes: "",
  received_at: new Date(),
  right_type: "access",
  source: "manual",
  assigned_to: null,
};

export function RequestForm({
  companyId,
  members,
  currentPlan,
}: RequestFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestCreateSchema),
    defaultValues,
  });

  const receivedAtValue = form.watch("received_at");
  const receivedAt =
    receivedAtValue instanceof Date ? receivedAtValue : new Date();
  const deadline = calculateDeadline(receivedAt);

  async function onSubmit(values: RequestFormValues) {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          company_id: companyId,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create request");
      }

      toast.success("Request logged");
      router.push(`/requests/${payload.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create request");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-6" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <Label htmlFor="requester_name">Requester name</Label>
        <Input id="requester_name" {...form.register("requester_name")} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="requester_email">Requester email</Label>
        <Input id="requester_email" type="email" {...form.register("requester_email")} />
      </div>

      <div className="grid gap-2">
        <Label>Right type</Label>
        <Select
          defaultValue={form.getValues("right_type")}
          onValueChange={(value) =>
            form.setValue("right_type", value as RightType, { shouldValidate: true })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a GDPR right" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(RIGHT_TYPE_LABELS) as RightType[]).map((rightType) => (
              <SelectItem key={rightType} value={rightType}>
                {RIGHT_TYPE_LABELS[rightType]} - {RIGHT_TYPE_DESCRIPTIONS[rightType]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="received_at">When was it received?</Label>
        <Input
          id="received_at"
          type="date"
          defaultValue={format(receivedAt, "yyyy-MM-dd")}
          onChange={(event) =>
            form.setValue("received_at", new Date(event.target.value), {
              shouldValidate: true,
            })
          }
        />
      </div>

      <Card className="border-violet-200 bg-violet-50/60">
        <CardContent className="space-y-2 p-4 text-sm">
          <p className="font-medium text-violet-950">
            Deadline: {format(deadline, "PPP")}
          </p>
          <p className="text-violet-700">
            GDPR clock starts when the request was received, not when you log it.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-2">
        <Label>How was it received?</Label>
        <Select
          defaultValue="manual"
          onValueChange={(value) =>
            form.setValue(
              "source",
              value === "letter" || value === "other" ? "manual" : (value as "manual" | "intake_form" | "email"),
              { shouldValidate: true },
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="letter">Letter</SelectItem>
            <SelectItem value="intake_form">Intake form</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={5} {...form.register("description")} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="internal_notes">Internal notes</Label>
        <Textarea id="internal_notes" rows={4} {...form.register("internal_notes")} />
      </div>

      {currentPlan !== "solo" ? (
        <div className="grid gap-2">
          <Label>Assign to</Label>
          <Select
            onValueChange={(value) =>
              form.setValue("assigned_to", value === "unassigned" ? null : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Unassigned" />
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
      ) : null}

      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Log request
      </Button>
    </form>
  );
}
