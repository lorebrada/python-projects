import { Button, Heading, Text } from "@react-email/components";

import { EmailShell } from "@/components/emails/EmailShell";

interface PaymentFailedProps {
  company_name: string;
  billing_url: string;
}

export function PaymentFailed({
  company_name,
  billing_url,
}: PaymentFailedProps) {
  return (
    <EmailShell preview={`Action needed: payment failed for ${company_name}`}>
      <Heading as="h1">Payment failed</Heading>
      <Text>
        We were unable to process your latest DSAR Desk subscription payment for{" "}
        {company_name}.
      </Text>
      <Text>
        Update your billing details to keep deadline alerts, audit exports, and
        request tracking active.
      </Text>
      <Button
        href={billing_url}
        style={{
          backgroundColor: "#6D28D9",
          borderRadius: "8px",
          color: "#ffffff",
          display: "inline-block",
          padding: "12px 18px",
          textDecoration: "none",
        }}
      >
        Open Billing Portal
      </Button>
    </EmailShell>
  );
}

export default PaymentFailed;
