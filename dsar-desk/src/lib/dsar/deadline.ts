export function calculateDeadline(receivedAt: Date): Date {
  const d = new Date(receivedAt);
  d.setDate(d.getDate() + 30);
  return d;
}

export function calculateExtendedDeadline(receivedAt: Date): Date {
  const d = new Date(receivedAt);
  d.setDate(d.getDate() + 90);
  return d;
}

export interface DeadlineStatus {
  daysRemaining: number;
  hoursRemaining: number;
  isOverdue: boolean;
  urgency: "ok" | "warning" | "critical" | "overdue";
  label: string;
  color: string;
}

export function getDeadlineStatus(deadline: Date): DeadlineStatus {
  const now = Date.now();
  const ms = deadline.getTime() - now;
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor(ms / 3_600_000);
  const isOverdue = ms < 0;
  let urgency: DeadlineStatus["urgency"];
  let color: string;

  if (isOverdue) {
    urgency = "overdue";
    color = "text-red-700 bg-red-50 border-red-200";
  } else if (days <= 3) {
    urgency = "critical";
    color = "text-red-600 bg-red-50 border-red-200";
  } else if (days <= 10) {
    urgency = "warning";
    color = "text-amber-600 bg-amber-50 border-amber-200";
  } else {
    urgency = "ok";
    color = "text-green-700 bg-green-50 border-green-200";
  }

  const label = isOverdue
    ? `Overdue by ${Math.abs(days)} days`
    : days === 0
      ? "Due today"
      : `${days} days left`;

  return {
    daysRemaining: days,
    hoursRemaining: hours,
    isOverdue,
    urgency,
    label,
    color,
  };
}
