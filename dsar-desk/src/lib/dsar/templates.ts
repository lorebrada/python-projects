import type { ResponseTemplate } from "@/types";

export const DEFAULT_TEMPLATES: ResponseTemplate[] = [
  {
    right_type: "all",
    name: "Standard Acknowledgment",
    subject: "We received your data request — [{{company_name}}]",
    body: `Dear {{requester_name}},

We confirm receipt of your data subject request received on {{received_date}}.

Under GDPR Article 12, we will respond within 30 days, and no later than {{deadline_date}}.

Your request reference is {{request_id}}. Please keep this reference for future correspondence.

If you have any questions while we process your request, please contact {{dpo_email}}.

Kind regards,
{{dpo_name}}
{{company_name}}`,
    language: "en",
    is_default: true,
  },
  {
    right_type: "access",
    name: "Access Request — Data Provided",
    subject: "Your data access request has been fulfilled — {{company_name}}",
    body: `Dear {{requester_name}},

We have completed your request for access to your personal data under GDPR Article 15.

Attached or linked to this email you will find:
- the personal data we currently hold about you;
- the categories of data processed;
- the purposes for which the data is used;
- the relevant retention periods; and
- the categories of third parties with whom the data has been shared, where applicable.

Reference: {{request_id}}

If you require clarification about any part of this response, please contact {{dpo_email}}.

Kind regards,
{{dpo_name}}
{{company_name}}`,
    language: "en",
    is_default: true,
  },
  {
    right_type: "erasure",
    name: "Erasure Request — Data Deleted",
    subject: "Your erasure request has been completed — {{company_name}}",
    body: `Dear {{requester_name}},

We confirm that we have processed your request for erasure under GDPR Article 17.

Your personal data has been deleted from our active systems, except where we are required to retain limited information for legal, regulatory, or security reasons. Where relevant, third parties processing your data on our behalf have also been notified.

Reference: {{request_id}}

If you would like further details about any retained records or applicable exemptions, please contact {{dpo_email}}.

Kind regards,
{{dpo_name}}
{{company_name}}`,
    language: "en",
    is_default: true,
  },
  {
    right_type: "portability",
    name: "Portability — Data Export Ready",
    subject: "Your data export is ready — {{company_name}}",
    body: `Dear {{requester_name}},

We have completed your portability request under GDPR Article 20.

Your personal data has been prepared in a structured, commonly used, and machine-readable format such as CSV or JSON. If this response includes a download link, please note the access period and any expiry date communicated separately.

Reference: {{request_id}}

If you need assistance using the exported file, please contact {{dpo_email}}.

Kind regards,
{{dpo_name}}
{{company_name}}`,
    language: "en",
    is_default: true,
  },
  {
    right_type: "rectification",
    name: "Rectification — Data Updated",
    subject: "Your data has been updated — {{company_name}}",
    body: `Dear {{requester_name}},

We confirm that we have updated your personal data following your rectification request under GDPR Article 16.

The inaccurate or incomplete information identified in your request has been corrected in our records. Where appropriate, relevant third parties or processors have also been informed of the updated information.

Reference: {{request_id}}

If you would like confirmation of the corrected data points, please contact {{dpo_email}}.

Kind regards,
{{dpo_name}}
{{company_name}}`,
    language: "en",
    is_default: true,
  },
  {
    right_type: "restriction",
    name: "Processing Restricted",
    subject: "Processing of your data has been restricted — {{company_name}}",
    body: `Dear {{requester_name}},

We confirm that we have restricted the processing of your personal data in accordance with GDPR Article 18.

This means we will store your data but will not otherwise use it except where legally permitted, for example with your consent, for legal claims, or to protect the rights of another person.

Reference: {{request_id}}

If the restriction is later lifted, we will inform you before any further processing takes place.

Kind regards,
{{dpo_name}}
{{company_name}}`,
    language: "en",
    is_default: true,
  },
  {
    right_type: "objection",
    name: "Objection — Processing Ceased",
    subject: "We have actioned your objection — {{company_name}}",
    body: `Dear {{requester_name}},

We confirm that we have reviewed your objection under GDPR Article 21.

Where your objection applies and no overriding lawful basis exists, we have stopped the relevant processing. If any limited processing continues, it is because compelling legitimate grounds or legal obligations require it, and those grounds will be explained in our final response.

Reference: {{request_id}}

You also have the right to lodge a complaint with your national data protection authority if you are dissatisfied with our response.

Kind regards,
{{dpo_name}}
{{company_name}}`,
    language: "en",
    is_default: true,
  },
  {
    right_type: "all",
    name: "Identity Verification Required",
    subject: "We need to verify your identity — {{company_name}}",
    body: `Dear {{requester_name}},

Before we can continue processing your data request, we need to verify your identity to protect your personal data and prevent unauthorized disclosure.

Please reply with one suitable proof of identity, or another verification method requested by our team. We will only use this information for verification purposes.

Please note that we may pause substantive processing of your request until verification is completed.

Reference: {{request_id}}

Kind regards,
{{dpo_name}}
{{company_name}}`,
    language: "en",
    is_default: true,
  },
  {
    right_type: "all",
    name: "Request Refused (Lawful Grounds)",
    subject: "Regarding your data request — {{company_name}}",
    body: `Dear {{requester_name}},

We have carefully reviewed your request and, after assessment, we are unable to comply in full on lawful grounds.

Examples of the reasons this may apply include where a request is manifestly unfounded or excessive, where disclosure would adversely affect the rights and freedoms of others, or where legal obligations prevent the action requested.

If you would like a fuller explanation of the reason for refusal in your specific case, please contact {{dpo_email}}. You also have the right to lodge a complaint with your national data protection authority.

Reference: {{request_id}}

Kind regards,
{{dpo_name}}
{{company_name}}`,
    language: "en",
    is_default: true,
  },
];
