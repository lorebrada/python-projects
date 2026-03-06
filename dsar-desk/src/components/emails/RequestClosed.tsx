import { Heading, Link, Text } from "@react-email/components";

import { EmailShell } from "@/components/emails/EmailShell";

interface RequestClosedProps {
  requester_name: string;
  company_name: string;
  right_type: string;
  request_id: string;
  response_sent_at: string;
  dpa_name: string;
  dpa_url: string;
}

export function RequestClosed({
  requester_name,
  company_name,
  right_type,
  request_id,
  response_sent_at,
  dpa_name,
  dpa_url,
}: RequestClosedProps) {
  return (
    <EmailShell preview={`Your ${right_type} request has been fulfilled`}>
      <Heading as="h1">Your request has been fulfilled</Heading>
      <Text>Dear {requester_name},</Text>
      <Text>
        {company_name} has completed your {right_type} request. Reference:{" "}
        <strong>{request_id}</strong>.
      </Text>
      <Text>Response sent: {response_sent_at}</Text>
      <Text>
        If you are not satisfied with our response, you have the right to lodge
        a complaint with your national data protection authority.
      </Text>
      <Text>
        Relevant authority: <strong>{dpa_name}</strong> -{" "}
        <Link href={dpa_url}>{dpa_url}</Link>
      </Text>
    </EmailShell>
  );
}

export default RequestClosed;
