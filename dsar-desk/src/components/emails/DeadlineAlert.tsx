import { Button, Heading, Section, Text } from "@react-email/components";

import { EmailShell } from "@/components/emails/EmailShell";

interface DeadlineAlertProps {
  user_name: string;
  company_name: string;
  requests: Array<{
    id: string;
    requester_name: string;
    right_type: string;
    deadline_at: string;
    days_remaining: number;
  }>;
}

export function DeadlineAlert({
  user_name,
  company_name,
  requests,
}: DeadlineAlertProps) {
  const overdue = requests.filter((request) => request.days_remaining < 0);

  return (
    <EmailShell
      preview={`Attention required: ${requests.length} DSAR requests need action`}
    >
      <Heading as="h1">Deadlines approaching for {company_name}</Heading>
      <Text>Hello {user_name},</Text>
      <Text>
        You have {requests.length} requests due in the next 7 days. Review the
        items below to avoid missing your GDPR response deadline.
      </Text>
      {requests.map((request) => (
        <Section
          key={request.id}
          style={{
            border: "1px solid #ddd6fe",
            borderRadius: "12px",
            marginBottom: "12px",
            padding: "16px",
          }}
        >
          <Text style={{ margin: 0, fontWeight: 700 }}>{request.requester_name}</Text>
          <Text style={{ margin: "6px 0" }}>
            {request.right_type} request - deadline {request.deadline_at}
          </Text>
          <Text style={{ color: request.days_remaining < 0 ? "#b91c1c" : "#7c3aed" }}>
            {request.days_remaining < 0
              ? `OVERDUE by ${Math.abs(request.days_remaining)} days`
              : `${request.days_remaining} days remaining`}
          </Text>
        </Section>
      ))}
      {overdue.length > 0 ? (
        <Section
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            padding: "16px",
          }}
        >
          <Text style={{ color: "#b91c1c", fontWeight: 700 }}>
            OVERDUE - immediate action required
          </Text>
        </Section>
      ) : null}
      <Button
        href={`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/requests`}
        style={{
          backgroundColor: "#6D28D9",
          borderRadius: "8px",
          color: "#ffffff",
          display: "inline-block",
          marginTop: "20px",
          padding: "12px 18px",
          textDecoration: "none",
        }}
      >
        Manage Requests
      </Button>
    </EmailShell>
  );
}

export default DeadlineAlert;
