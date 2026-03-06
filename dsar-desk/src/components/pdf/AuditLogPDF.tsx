import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { AuditEvent, RequestRecord } from "@/types";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    color: "#111827",
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 32,
  },
  coverTitle: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 12,
  },
  sectionTitle: {
    borderBottom: "1 solid #d1d5db",
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 12,
    paddingBottom: 6,
  },
  card: {
    border: "1 solid #e5e7eb",
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  key: {
    color: "#6b7280",
    width: 120,
  },
  value: {
    flex: 1,
  },
  footer: {
    bottom: 16,
    color: "#6b7280",
    fontSize: 9,
    left: 32,
    position: "absolute",
    right: 32,
    textAlign: "right",
  },
  logo: {
    height: 48,
    marginBottom: 24,
    objectFit: "contain",
    width: 120,
  },
});

export interface AuditLogPdfRequest {
  request: RequestRecord;
  auditEvents: AuditEvent[];
}

interface AuditLogPDFProps {
  companyName: string;
  logoUrl?: string | null;
  from?: string | null;
  to?: string | null;
  generatedAt: string;
  requests: AuditLogPdfRequest[];
  stats: {
    totalRequests: number;
    completedOnTime: number;
    completedOnTimeRate: number;
    averageResponseDays: number;
    overdue: number;
    byRightType: Record<string, number>;
  };
}

export function AuditLogPDF({
  companyName,
  logoUrl,
  from,
  to,
  generatedAt,
  requests,
  stats,
}: AuditLogPDFProps) {
  return (
    <Document title={`GDPR Compliance Audit Log - ${companyName}`}>
      <Page size="A4" style={styles.page}>
        {logoUrl ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image src={logoUrl} style={styles.logo} />
        ) : null}
        <Text style={styles.coverTitle}>GDPR Compliance Audit Log</Text>
        <Text>{companyName}</Text>
        <Text>
          Date range: {from ?? "All time"} - {to ?? "Today"}
        </Text>
        <Text>Generated: {generatedAt}</Text>
        <Text style={{ marginTop: 16 }}>
          This document serves as evidence of GDPR Article 12 compliance for
          Data Subject Request management.
        </Text>
        <Text
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
          style={styles.footer}
        />
      </Page>
      {requests.map(({ request, auditEvents }) => (
        <Page key={request.id} size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Request {request.id}</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.key}>Requester</Text>
              <Text style={styles.value}>
                {request.requester_name} ({request.requester_email})
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.key}>Right type</Text>
              <Text style={styles.value}>{request.right_type}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.key}>Status</Text>
              <Text style={styles.value}>{request.status}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.key}>Deadline</Text>
              <Text style={styles.value}>{request.extended_deadline_at ?? request.deadline_at}</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Audit events</Text>
          {auditEvents.map((event) => (
            <View key={event.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.key}>Timestamp</Text>
                <Text style={styles.value}>{event.created_at}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.key}>Actor</Text>
                <Text style={styles.value}>{event.actor_email ?? "System"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.key}>Event</Text>
                <Text style={styles.value}>{event.event_type}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.key}>Details</Text>
                <Text style={styles.value}>
                  {event.details ? JSON.stringify(event.details, null, 2) : "—"}
                </Text>
              </View>
            </View>
          ))}
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            fixed
            style={styles.footer}
          />
        </Page>
      ))}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Summary statistics</Text>
        <View style={styles.card}>
          <Text>Total requests in period: {stats.totalRequests}</Text>
          <Text>
            Completed on time: {stats.completedOnTime} (
            {stats.completedOnTimeRate.toFixed(0)}%)
          </Text>
          <Text>Average response time: {stats.averageResponseDays.toFixed(1)} days</Text>
          <Text>Overdue: {stats.overdue}</Text>
        </View>
        <Text style={styles.sectionTitle}>Breakdown by right type</Text>
        <View style={styles.card}>
          {Object.entries(stats.byRightType).map(([rightType, count]) => (
            <Text key={rightType}>
              {rightType}: {count}
            </Text>
          ))}
        </View>
        <Text
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
          style={styles.footer}
        />
      </Page>
    </Document>
  );
}

export default AuditLogPDF;
