import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-violet-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.2em] text-violet-200">DSAR Desk</p>
          <h1 className="max-w-md text-4xl font-semibold tracking-tight">
            The simplest way to never miss a GDPR response deadline.
          </h1>
          <p className="max-w-xl text-violet-100/80">
            Receive requests, track Article 12 deadlines, send templated
            responses, and keep an audit trail ready for regulators.
          </p>
        </div>
        <p className="text-sm text-violet-200">
          Monthly billing. No enterprise bloat. Built for EU companies.
        </p>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link className="text-sm font-medium text-violet-700" href="/">
              ← Back to DSAR Desk
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
