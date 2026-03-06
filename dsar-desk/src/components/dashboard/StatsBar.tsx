import { AlertTriangle, CheckCircle2, Clock3, Inbox } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsBarProps {
  stats: {
    openRequests: number;
    dueThisWeek: number;
    overdue: number;
    completedThisMonth: number;
  };
}

const cards = [
  {
    key: "openRequests",
    title: "Open Requests",
    icon: Inbox,
    color: "text-blue-600",
  },
  {
    key: "dueThisWeek",
    title: "Due This Week",
    icon: Clock3,
    color: "text-amber-600",
  },
  {
    key: "overdue",
    title: "Overdue",
    icon: AlertTriangle,
    color: "text-red-600",
  },
  {
    key: "completedThisMonth",
    title: "Completed This Month",
    icon: CheckCircle2,
    color: "text-green-600",
  },
] as const;

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key];

        return (
          <Card key={card.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`size-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-3xl font-semibold">
                {value}
                {card.key === "overdue" && value > 0 ? (
                  <span className="size-2 animate-pulse rounded-full bg-red-500" />
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
