import { Heading, Text } from "@react-email/components";

import { EmailShell } from "@/components/emails/EmailShell";

interface RequestAcknowledgmentProps {
  requester_name: string;
  company_name: string;
  right_type: string;
  request_id: string;
  received_date: string;
  deadline_date: string;
  dpo_email: string;
}

export function RequestAcknowledgment({
  requester_name,
  company_name,
  right_type,
  request_id,
  received_date,
  deadline_date,
  dpo_email,
}: RequestAcknowledgmentProps) {
  return (
    <EmailShell
      preview={`Data request received - ${company_name} will respond by ${deadline_date}`}
    >
      <Heading as="h1">We received your data request</Heading>
      <Text>Dear {requester_name},</Text>
      <Text>
        We confirm receipt of your {right_type} request on {received_date}. Your
        reference number is <strong>{request_id}</strong>.
      </Text>
      <Text>
        Under GDPR Article 12, we will respond by <strong>{deadline_date}</strong>.
      </Text>
      <Text>
        If you have questions while we process your request, contact {dpo_email}.
      </Text>
      <Text>
        This message concerns your rights under GDPR Articles 15-22 and has been
        sent by {company_name}.
      </Text>
    </EmailShell>
  );
}

export default RequestAcknowledgment;
