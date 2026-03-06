"use client";

import { useMemo, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { buildTemplateVariables, resolveTemplate, resolveTemplateString } from "@/lib/template-resolver";
import type { Company, RequestRecord, ResponseTemplate } from "@/types";

interface ResponseComposerProps {
  request: RequestRecord;
  company: Company;
  templates: ResponseTemplate[];
}

export function ResponseComposer({
  request,
  company,
  templates,
}: ResponseComposerProps) {
  const variables = useMemo(
    () => buildTemplateVariables({ request, company }),
    [company, request],
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id ?? "custom",
  );
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
  const [body, setBody] = useState(
    selectedTemplate ? resolveTemplate(selectedTemplate, variables).body : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const preview = useMemo(
    () => resolveTemplateString(body, variables),
    [body, variables],
  );

  const subjectPreview = useMemo(() => {
    if (!selectedTemplate) {
      return "Custom response";
    }

    return resolveTemplate(selectedTemplate, variables).subject;
  }, [selectedTemplate, variables]);

  function handleTemplateChange(value: string) {
    setSelectedTemplateId(value);
    const template = templates.find((item) => item.id === value);

    if (template) {
      setBody(resolveTemplate(template, variables).body);
    }
  }

  async function submit(sendEmail: boolean) {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/requests/${request.id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_id: selectedTemplate?.id ?? null,
          custom_body: body,
          send_email: sendEmail,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to send response");
      }

      toast.success(sendEmail ? "Response sent" : "Draft saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send response");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label>Template</Label>
        <Select onValueChange={handleTemplateChange} value={selectedTemplateId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a response template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id ?? template.name} value={template.id ?? template.name}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Email body</Label>
        <Textarea rows={14} value={body} onChange={(event) => setBody(event.target.value)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Subject</p>
            <p className="font-medium">{subjectPreview}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Resolved body</p>
            <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 font-sans text-sm">
              {preview}
            </pre>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button disabled={isSubmitting} onClick={() => void submit(true)} type="button">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Send response email
        </Button>
        <Button
          disabled={isSubmitting}
          onClick={() => void submit(false)}
          type="button"
          variant="outline"
        >
          Save draft (no email)
        </Button>
      </div>
    </div>
  );
}
