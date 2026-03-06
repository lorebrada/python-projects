"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDistanceStrict } from "date-fns";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { publicIntakeSchema } from "@/lib/dsar/schemas";

const intakeFormSchema = publicIntakeSchema.extend({
  acceptedPrivacyNotice: z
    .boolean()
    .refine((value) => value, { message: "You must accept the privacy notice." }),
});

type IntakeFormValues = z.input<typeof intakeFormSchema>;

interface IntakeFormProps {
  token: string;
  companyName: string;
}

export function IntakeForm({ token, companyName }: IntakeFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<null | { id: string; deadlineAt: string }>(null);
  const form = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeFormSchema),
    defaultValues: {
      token,
      requester_name: "",
      requester_email: "",
      right_type: "access",
      description: "",
      acceptedPrivacyNotice: true,
    },
  });

  const countdown = useMemo(() => {
    if (!success?.deadlineAt) {
      return null;
    }

    return formatDistanceStrict(new Date(), new Date(success.deadlineAt));
  }, [success]);

  async function onSubmit(values: IntakeFormValues) {
    setSubmitting(true);

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit request");
      }

      setSuccess({
        id: payload.id,
        deadlineAt: payload.deadline_at,
      });
      form.reset({
        token,
        requester_name: "",
        requester_email: "",
        right_type: "access",
        description: "",
        acceptedPrivacyNotice: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h2 className="text-2xl font-semibold">Request received</h2>
          <p className="text-muted-foreground">
            You will hear from us within 30 days. Reference:{" "}
            <span className="font-medium text-foreground">{success.id}</span>
          </p>
          <p className="text-sm text-violet-700">
            Deadline countdown: {countdown} (by {new Date(success.deadlineAt).toLocaleDateString()})
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <Label htmlFor="requester_name">Your name</Label>
        <Input id="requester_name" {...form.register("requester_name")} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="requester_email">Your email</Label>
        <Input id="requester_email" type="email" {...form.register("requester_email")} />
      </div>
      <div className="grid gap-2">
        <Label>What type of request?</Label>
        <Select
          defaultValue="access"
          onValueChange={(value) =>
            form.setValue(
              "right_type",
              value as IntakeFormValues["right_type"],
              { shouldValidate: true },
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a request type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="access">Access - I want a copy of my data</SelectItem>
            <SelectItem value="erasure">Erasure - I want my data deleted</SelectItem>
            <SelectItem value="portability">
              Portability - I want my data in a downloadable format
            </SelectItem>
            <SelectItem value="rectification">
              Rectification - I want to correct my data
            </SelectItem>
            <SelectItem value="restriction">
              Restriction - I want to restrict how you use my data
            </SelectItem>
            <SelectItem value="objection">
              Objection - I want to object to how you use my data
            </SelectItem>
            <SelectItem value="not_sure">Not sure - I will describe my request below</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Your request</Label>
        <Textarea
          id="description"
          placeholder="Please describe what you would like..."
          rows={6}
          {...form.register("description")}
        />
      </div>
      <div className="flex items-start gap-3 rounded-xl border p-4">
        <Checkbox
          checked={Boolean(form.watch("acceptedPrivacyNotice"))}
          id="acceptedPrivacyNotice"
          onCheckedChange={(checked) =>
            form.setValue("acceptedPrivacyNotice", Boolean(checked), {
              shouldValidate: true,
            })
          }
        />
        <div className="space-y-1 text-sm">
          <Label htmlFor="acceptedPrivacyNotice" className="text-sm font-medium">
            I understand that {companyName} will use my name and email to process this
            request under GDPR.
          </Label>
        </div>
      </div>
      <Button className="w-full" disabled={submitting} type="submit">
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Submit request
      </Button>
      <input type="hidden" value={token} {...form.register("token")} />
    </form>
  );
}
