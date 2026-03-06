import Link from "next/link";

import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <p className="text-sm text-muted-foreground">
          Access your DSAR Desk workspace to manage requests and deadlines.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <LoginForm nextPath={params.next ?? "/dashboard"} />
        <p className="text-sm text-muted-foreground">
          New here?{" "}
          <Link className="font-medium text-violet-700" href="/register">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
