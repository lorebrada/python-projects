import { format } from "date-fns";

import type { Company, RequestRecord, ResponseTemplate } from "@/types";

export interface TemplateVariables {
  [key: string]: string | undefined;
}

export function resolveTemplateString(
  content: string,
  variables: TemplateVariables,
) {
  return content.replace(/\{\{(.*?)\}\}/g, (_, key: string) => {
    const trimmedKey = key.trim();
    return variables[trimmedKey] ?? `{{${trimmedKey}}}`;
  });
}

export function resolveTemplate(
  template: Pick<ResponseTemplate, "subject" | "body">,
  variables: TemplateVariables,
) {
  return {
    subject: resolveTemplateString(template.subject, variables),
    body: resolveTemplateString(template.body, variables),
  };
}

export function buildTemplateVariables(params: {
  request: RequestRecord;
  company: Company;
}) {
  const { request, company } = params;

  return {
    requester_name: request.requester_name,
    requester_email: request.requester_email,
    company_name: company.name,
    request_id: request.id,
    dpo_email: company.dpo_email ?? company.owner_id ?? "",
    dpo_name: company.dpo_name ?? company.name,
    deadline_date: format(new Date(request.deadline_at), "PPP"),
    received_date: format(new Date(request.received_at), "PPP"),
  } satisfies TemplateVariables;
}
