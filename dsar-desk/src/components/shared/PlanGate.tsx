import type { PropsWithChildren } from "react";

import { Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlanKey } from "@/types";

interface PlanGateProps extends PropsWithChildren {
  currentPlan: PlanKey;
  minimumPlan: PlanKey;
  title: string;
  description: string;
}

const planOrder: Record<PlanKey, number> = {
  solo: 1,
  team: 2,
  agency: 3,
};

export function PlanGate({
  currentPlan,
  minimumPlan,
  title,
  description,
  children,
}: PlanGateProps) {
  if (planOrder[currentPlan] >= planOrder[minimumPlan]) {
    return <>{children}</>;
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-violet-100 p-2 text-violet-700">
            <Lock className="size-4" />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <Badge variant="secondary" className="mt-2">
              {minimumPlan} plan and up
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {description}
      </CardContent>
    </Card>
  );
}
