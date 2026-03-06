import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/types";

const statusStyles: Record<RequestStatus, string> = {
  open: "bg-zinc-100 text-zinc-700",
  in_progress: "bg-blue-100 text-blue-700",
  awaiting_verification: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  extended: "bg-violet-100 text-violet-700",
  refused: "bg-orange-100 text-orange-700",
  overdue: "bg-red-100 text-red-700",
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return (
    <Badge className={cn("capitalize", statusStyles[status])} variant="secondary">
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
