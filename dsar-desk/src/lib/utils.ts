import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string | Date | null, pattern = "PPP") {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);
  return format(date, pattern);
}

export function formatDateTime(value?: string | Date | null) {
  return formatDate(value, "PPP p");
}

export function formatCurrency(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function truncateMiddle(value: string, keep = 6) {
  if (value.length <= keep * 2) {
    return value;
  }

  return `${value.slice(0, keep)}…${value.slice(-keep)}`;
}

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
