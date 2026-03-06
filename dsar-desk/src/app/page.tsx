import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLANS } from "@/lib/stripe/plans";
import { formatCurrency } from "@/lib/utils";

const features = [
  "30-day deadline tracker - automatic, color-coded, with alerts",
  "Public intake form - give users a link, they submit requests directly",
  "GDPR response templates - all 6 data subject rights, pre-written",
  "Immutable audit log - proof you responded, ready for inspectors",
  "PDF audit export - what a data protection authority actually requests",
  "Team collaboration - assign requests, multi-user (Team plan)",
];

const faqItems = [
  {
    value: "item-1",
    question: "What is a DSAR?",
    answer:
      "A Data Subject Access Request is a formal request from an individual to a company asking for information about their personal data under GDPR. Articles 15-22 give EU residents 6 distinct rights.",
  },
  {
    value: "item-2",
    question: "What happens if I miss the 30-day deadline?",
    answer:
      "You are automatically in violation of GDPR Article 12. Your national data protection authority can fine you up to €20 million or 4% of global turnover, whichever is higher.",
  },
  {
    value: "item-3",
    question: "Do I need DSAR Desk if I only get 1-2 requests a year?",
    answer:
      "Yes - exactly then. A spreadsheet works until a DPA investigator asks for your audit trail. DSAR Desk generates that in one click.",
  },
  {
    value: "item-4",
    question: "Can I embed the intake form on my website?",
    answer:
      "Yes. Every company gets a hosted intake page at dsardesk.com/intake/your-token. Add the link to your privacy policy.",
  },
  {
    value: "item-5",
    question: "Is DSAR Desk itself GDPR compliant?",
    answer:
      "Yes. Data is hosted on EU Supabase infrastructure (Frankfurt). We are a data processor; your company is the data controller. DPA available on request.",
  },
  {
    value: "item-6",
    question: "Do I need a lawyer to use this?",
    answer:
      "DSAR Desk automates the operational layer - tracking, templates, audit logs. For complex legal questions (refusals, disputes), always consult a qualified privacy lawyer.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-8">
            <Badge className="bg-violet-100 text-violet-700" variant="secondary">
              Used by 200+ EU companies. €0 in missed deadlines.
            </Badge>
            <div className="space-y-6">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl">
                Never miss a GDPR deadline again.
              </h1>
              <p className="max-w-3xl text-xl text-muted-foreground">
                When someone emails asking for their data, you have 30 days to
                respond - or face fines up to €20 million. DSAR Desk tracks
                every request, sends you alerts, and generates the audit trail
                regulators actually ask for.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="bg-violet-700 hover:bg-violet-800" size="lg">
                <Link href="/register">Start free - no credit card</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#demo">See how it works</a>
              </Button>
            </div>
          </div>
          <Card className="border-violet-200 bg-violet-50">
            <CardHeader>
              <CardTitle>What DSAR Desk does</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-violet-950">
              <p>Receive a request.</p>
              <p>Track the 30-day deadline.</p>
              <p>Send a templated response.</p>
              <p>Generate the audit log regulators actually ask for.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-zinc-950 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 md:grid-cols-3">
          {[
            ["€20,000,000", "maximum fine for GDPR non-compliance"],
            ["30 days", "your legal deadline to respond to any data request"],
            ["€1,524", "average cost of processing one DSAR manually (Gartner)"],
          ].map(([value, label]) => (
            <Card key={value} className="border-white/10 bg-white/5 text-white">
              <CardContent className="space-y-3 p-6">
                <p className="text-4xl font-semibold">{value}</p>
                <p className="text-white/70">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24" id="demo">
        <div className="mb-10 max-w-2xl space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-700">
            How it works
          </p>
          <h2 className="text-4xl font-semibold tracking-tight">
            A focused GDPR operations workflow
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            [
              "Step 1: A person submits a request",
              "Via your public intake form or log it manually.",
            ],
            [
              "Step 2: Track the 30-day countdown",
              "See every open request with color-coded deadlines. Get email alerts before time runs out.",
            ],
            [
              "Step 3: Respond and close",
              "Use built-in GDPR response templates. One click sends the response and logs it to your audit trail.",
            ],
          ].map(([title, description]) => (
            <Card key={title}>
              <CardContent className="space-y-3 p-6">
                <p className="text-lg font-semibold">{title}</p>
                <p className="text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature}>
              <CardContent className="p-6 text-base">{feature}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="overflow-hidden rounded-2xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                {["Feature", "DSAR Desk", "OneTrust", "ComplyDog", "Spreadsheet"].map(
                  (header) => (
                    <th key={header} className="px-4 py-3 font-medium">
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {[
                ["Price", "€15/mo", "$200K+/yr", "$49/mo", "€0"],
                ["Setup time", "5 minutes", "6 months", "1 day", "Instant"],
                ["DSAR tracking", "✓", "✓", "✓", "Manual"],
                ["Deadline alerts", "✓", "✓", "✗", "✗"],
                ["Audit log PDF", "✓", "✓", "✗", "✗"],
                ["Public intake form", "✓", "✓", "✓", "✗"],
                ["Monthly billing", "✓", "✗", "Annual", "—"],
              ].map((row) => (
                <tr key={row[0]} className="border-t">
                  {row.map((cell) => (
                    <td key={cell} className="px-4 py-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-10 flex flex-col gap-3">
          <h2 className="text-4xl font-semibold tracking-tight">Pricing</h2>
          <p className="text-muted-foreground">14-day free trial on all plans.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {Object.values(PLANS).map((plan) => (
            <Card
              key={plan.key}
              className={plan.key === "team" ? "border-violet-500 shadow-lg shadow-violet-100" : ""}
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.key === "team" ? (
                    <Badge className="bg-violet-100 text-violet-700" variant="secondary">
                      Most Popular
                    </Badge>
                  ) : null}
                </div>
                <div>
                  <p className="text-4xl font-semibold">{formatCurrency(plan.price)}</p>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
                <Button asChild className="w-full" variant={plan.key === "team" ? "default" : "outline"}>
                  <Link href="/register">Start free</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24">
        <h2 className="mb-8 text-4xl font-semibold tracking-tight">FAQ</h2>
        <Accordion className="w-full" collapsible type="single">
          {faqItems.map((item) => (
            <AccordionItem key={item.value} value={item.value}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© 2026 DSAR Desk</p>
          <div className="flex flex-wrap gap-4">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms</a>
            <a href="#">DPA</a>
            <a href="#">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
