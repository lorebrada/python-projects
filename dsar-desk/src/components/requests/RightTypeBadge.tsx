import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RIGHT_TYPE_LABELS } from "@/lib/dsar/reference";
import type { RightType } from "@/types";

const rightTypeStyles: Record<RightType, string> = {
  access: "bg-indigo-100 text-indigo-700",
  erasure: "bg-red-100 text-red-700",
  portability: "bg-cyan-100 text-cyan-700",
  rectification: "bg-orange-100 text-orange-700",
  restriction: "bg-yellow-100 text-yellow-700",
  objection: "bg-pink-100 text-pink-700",
};

export function RightTypeBadge({ rightType }: { rightType: RightType }) {
  return (
    <Badge className={cn(rightTypeStyles[rightType])} variant="secondary">
      {RIGHT_TYPE_LABELS[rightType]}
    </Badge>
  );
}
