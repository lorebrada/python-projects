import Link from "next/link";

import { RequestTable } from "@/components/dashboard/RequestTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { requireCompanyData, getCompanyRequests } from "@/lib/server-data";

export default async function RequestsPage() {
  const authContext = await requireCompanyData();

  if (!authContext?.company) {
    return null;
  }

  const { requests } = await getCompanyRequests({
    companyId: authContext.company.id,
    limit: 50,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Requests"
        title="All requests"
        description="Every recorded data subject request, sorted by urgency."
        action={
          <Button asChild>
            <Link href="/requests/new">Log new request</Link>
          </Button>
        }
      />
      <RequestTable requests={requests} />
    </div>
  );
}
