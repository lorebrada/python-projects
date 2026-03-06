"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("IT");
  const [domain, setDomain] = useState("");

  async function handleSubmit() {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_name: companyName,
          country,
          domain,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create company");
      }

      toast.success("Workspace ready");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create company");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-2">
        <Label htmlFor="company_name">Company name</Label>
        <Input id="company_name" value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="country">Country code</Label>
        <Input id="country" maxLength={2} value={country} onChange={(event) => setCountry(event.target.value.toUpperCase())} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="domain">Domain</Label>
        <Input id="domain" placeholder="acme.com" value={domain} onChange={(event) => setDomain(event.target.value)} />
      </div>
      <Button className="w-full" disabled={loading} onClick={() => void handleSubmit()} type="button">
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Create company workspace
      </Button>
    </div>
  );
}
