import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTemplatesForCompany, requireCompanyData } from "@/lib/server-data";

export default async function TemplatesPage() {
  const authContext = await requireCompanyData();

  if (!authContext?.company) {
    return null;
  }

  const templates = await getTemplatesForCompany(authContext.company.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Templates"
        title="Response templates"
        description="Default GDPR response language for acknowledgment, fulfillment, verification, and refusal workflows."
      />
      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id ?? template.name}>
            <CardHeader>
              <CardTitle className="text-lg">{template.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-medium">{template.subject}</p>
              <pre className="whitespace-pre-wrap rounded-xl bg-muted p-4 font-sans">
                {template.body}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
