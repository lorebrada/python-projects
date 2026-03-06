import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAppUrl } from "@/lib/env";
import { requireCompanyData } from "@/lib/server-data";

export default async function SettingsPage() {
  const authContext = await requireCompanyData();

  if (!authContext?.company) {
    return null;
  }

  const intakeUrl = `${getAppUrl()}/intake/${authContext.company.intake_token}`;
  const embedSnippet = `<a href='${intakeUrl}' target='_blank'>Submit a Data Request</a>`;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Company settings"
        description="Configure the public intake form, DPO contact details, and embed instructions for your privacy pages."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Company details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Company name</Label>
              <Input defaultValue={authContext.company.name} readOnly />
            </div>
            <div className="grid gap-2">
              <Label>DPO email</Label>
              <Input defaultValue={authContext.company.dpo_email ?? ""} readOnly />
            </div>
            <div className="grid gap-2">
              <Label>DPO name</Label>
              <Input defaultValue={authContext.company.dpo_name ?? ""} readOnly />
            </div>
            <div className="grid gap-2">
              <Label>Country</Label>
              <Input defaultValue={authContext.company.country} readOnly />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Public intake form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-2">
              <Label>Hosted intake URL</Label>
              <Input defaultValue={intakeUrl} readOnly />
            </div>
            <p className="text-muted-foreground">
              Add this link to your Privacy Policy page, cookie banner, or footer so users can submit requests.
            </p>
            <div className="grid gap-2">
              <Label>Embed snippet</Label>
              <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-xs">
                {embedSnippet}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
