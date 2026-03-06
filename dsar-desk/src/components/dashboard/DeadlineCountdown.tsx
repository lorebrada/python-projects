import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DeadlineStatus } from "@/lib/dsar/deadline";

export function DeadlineCountdown({
  status,
  overdueEmphasis = false,
}: {
  status: DeadlineStatus;
  overdueEmphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        status.color,
        overdueEmphasis && status.isOverdue ? "font-semibold uppercase" : "",
      )}
    >
      {(status.urgency === "critical" || status.urgency === "overdue") && (
        <AlertTriangle className="size-3.5" />
      )}
      <span>
        {status.isOverdue && overdueEmphasis
          ? `OVERDUE - ${Math.abs(status.daysRemaining)} days ago`
          : status.label}
      </span>
    </div>
  );
}
