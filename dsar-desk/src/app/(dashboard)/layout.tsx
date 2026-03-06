import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthContext } from "@/lib/auth";
import { getAdminEmails } from "@/lib/env";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/requests", label: "Requests" },
  { href: "/templates", label: "Templates" },
  { href: "/audit-log", label: "Audit log" },
  { href: "/settings", label: "Settings" },
  { href: "/billing", label: "Billing" },
];

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const authContext = await getAuthContext();

  if (!authContext) {
    redirect("/login");
  }

  if (!authContext.company) {
    redirect("/onboarding");
  }

  const isAdmin = getAdminEmails().includes(authContext.user.email?.toLowerCase() ?? "");

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="grid min-h-screen xl:grid-cols-[260px_1fr]">
        <aside className="border-r bg-background p-6">
          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-violet-700">
                DSAR Desk
              </p>
              <h2 className="mt-2 text-xl font-semibold">{authContext.company.name}</h2>
              <p className="text-sm text-muted-foreground">{authContext.profile.email}</p>
              <Badge className="mt-3 bg-violet-100 text-violet-700" variant="secondary">
                {authContext.profile.plan} plan
              </Badge>
            </div>
            <nav className="grid gap-2">
              {navigation.map((item) => (
                <Button asChild key={item.href} className="justify-start" variant="ghost">
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
              {isAdmin ? (
                <Button asChild className="justify-start" variant="ghost">
                  <Link href="/admin">Admin</Link>
                </Button>
              ) : null}
            </nav>
          </div>
        </aside>
        <div className="p-6 lg:p-10">{children}</div>
      </div>
    </div>
  );
}
