import Image from "next/image";
import { notFound } from "next/navigation";

import { IntakeForm } from "@/components/intake/IntakeForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Company } from "@/types";

interface IntakePageProps {
  params: Promise<{ token: string }>;
}

export default async function IntakePage({ params }: IntakePageProps) {
  const { token } = await params;
  const admin = createSupabaseAdminClient();
  const { data: company } = await admin
    .from("companies")
    .select("*")
    .eq("intake_token", token)
    .eq("intake_enabled", true)
    .maybeSingle();
  const typedCompany = company as Company | null;

  if (!typedCompany) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-xl">
        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-4 text-center">
            {typedCompany.logo_url ? (
              <div className="flex justify-center">
                <Image
                  alt={typedCompany.name}
                  className="h-14 w-auto object-contain"
                  height={56}
                  src={typedCompany.logo_url}
                  width={140}
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <CardTitle className="text-3xl">{typedCompany.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Submit a GDPR data subject request. We will respond within 30 days.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <IntakeForm companyName={typedCompany.name} token={token} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
