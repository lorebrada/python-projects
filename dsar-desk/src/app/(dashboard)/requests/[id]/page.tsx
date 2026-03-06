import { notFound } from "next/navigation";

import { RequestDetailShell } from "@/components/requests/RequestDetailShell";
import {
  getCompanyMembers,
  getRequestDetail,
  getTemplatesForCompany,
  requireCompanyData,
} from "@/lib/server-data";

interface RequestDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({
  params,
}: RequestDetailPageProps) {
  const { id } = await params;
  const authContext = await requireCompanyData();

  if (!authContext?.company) {
    return null;
  }

  const [detail, members, templates] = await Promise.all([
    getRequestDetail(authContext.company.id, id),
    getCompanyMembers(authContext.company.id),
    getTemplatesForCompany(authContext.company.id),
  ]);

  if (!detail) {
    notFound();
  }

  return (
    <RequestDetailShell
      auditEvents={detail.auditEvents}
      company={authContext.company}
      currentPlan={authContext.profile.plan}
      members={members}
      request={detail.request}
      templates={templates}
    />
  );
}
