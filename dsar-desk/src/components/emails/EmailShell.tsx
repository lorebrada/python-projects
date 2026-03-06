import type { PropsWithChildren } from "react";

import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
} from "@react-email/components";

interface EmailShellProps extends PropsWithChildren {
  preview: string;
}

export function EmailShell({ preview, children }: EmailShellProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#f5f3ff",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          margin: 0,
          padding: "24px 0",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            margin: "0 auto",
            maxWidth: "640px",
            overflow: "hidden",
          }}
        >
          <Section
            style={{
              background:
                "linear-gradient(135deg, rgba(109,40,217,1) 0%, rgba(91,33,182,1) 100%)",
              color: "#ffffff",
              padding: "24px 32px",
            }}
          >
            <strong style={{ fontSize: "18px" }}>DSAR Desk</strong>
          </Section>
          <Section style={{ padding: "32px" }}>{children}</Section>
          <Hr style={{ borderColor: "#ede9fe", margin: 0 }} />
          <Section style={{ padding: "16px 32px", color: "#6b7280", fontSize: "12px" }}>
            Sent by DSAR Desk
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
