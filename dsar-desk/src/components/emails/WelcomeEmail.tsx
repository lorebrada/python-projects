import { Button, Heading, Link, Text } from "@react-email/components";

import { EmailShell } from "@/components/emails/EmailShell";

interface WelcomeEmailProps {
  name: string;
  company_name: string;
  dashboard_url: string;
  intake_url: string;
}

export function WelcomeEmail({
  name,
  company_name,
  dashboard_url,
  intake_url,
}: WelcomeEmailProps) {
  return (
    <EmailShell preview="Welcome to DSAR Desk - your workspace is ready">
      <Heading as="h1">Welcome to DSAR Desk, {name}</Heading>
      <Text>
        {company_name} is ready to track GDPR data subject requests in one
        place. DSAR Desk keeps every request, deadline, response, and audit log
        organized so your team does not miss Article 12 response windows.
      </Text>
      <Text>Next steps:</Text>
      <Text>1. Add your DPO email in Settings.</Text>
      <Text>2. Share your intake form: <Link href={intake_url}>{intake_url}</Link></Text>
      <Text>3. Log your first request if you already have one.</Text>
      <Button
        href={dashboard_url}
        style={{
          backgroundColor: "#6D28D9",
          borderRadius: "8px",
          color: "#ffffff",
          display: "inline-block",
          padding: "12px 18px",
          textDecoration: "none",
        }}
      >
        Open Dashboard
      </Button>
    </EmailShell>
  );
}

export default WelcomeEmail;
