import { PageHeader } from "@/components/shared/PageHeader";
import { RequestForm } from "@/components/requests/RequestForm";
import { Card, CardContent } from "@/components/ui/card";
import { getCompanyMembers, requireCompanyData } from "@/lib/server-data";

export default async function NewRequestPage() {
  const authContext = await requireCompanyData();

  if (!authContext?.company) {
    return null;
  }

  const members = await getCompanyMembers(authContext.company.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Requests"
        title="Log new request"
        description="Capture requester details, the right they exercised, how it was received, and the deadline calculated from the receipt date."
      />
      <Card>
        <CardContent className="p-6">
          <RequestForm
            companyId={authContext.company.id}
            currentPlan={authContext.profile.plan}
            members={members}
          />
        </CardContent>
      </Card>
    </div>
  );
}
