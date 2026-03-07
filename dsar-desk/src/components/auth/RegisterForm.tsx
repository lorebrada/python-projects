"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const demoMode =
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL;
  const [formState, setFormState] = useState({
    full_name: "",
    email: "",
    password: "",
    company_name: "",
  });

  async function handleSubmit() {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create account");
      }

      toast.success(
        demoMode ? "Demo workspace ready." : "Account created. Please sign in.",
      );
      router.push(demoMode ? "/dashboard" : "/login?registered=1");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          value={formState.full_name}
          onChange={(event) =>
            setFormState((current) => ({ ...current, full_name: event.target.value }))
          }
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="company_name">Company name</Label>
        <Input
          id="company_name"
          value={formState.company_name}
          onChange={(event) =>
            setFormState((current) => ({ ...current, company_name: event.target.value }))
          }
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formState.email}
          onChange={(event) =>
            setFormState((current) => ({ ...current, email: event.target.value }))
          }
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={formState.password}
          onChange={(event) =>
            setFormState((current) => ({ ...current, password: event.target.value }))
          }
        />
      </div>
      <Button className="w-full" disabled={loading} onClick={() => void handleSubmit()} type="button">
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Create workspace
      </Button>
    </div>
  );
}
