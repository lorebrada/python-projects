import Link from "next/link";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Create your workspace</CardTitle>
        <p className="text-sm text-muted-foreground">
          Sign up with your company name, create your first DSAR workspace, and
          start tracking GDPR deadlines in minutes.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <RegisterForm />
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="font-medium text-violet-700" href="/login">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
