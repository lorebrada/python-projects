import { z } from "zod";

const rightTypes = [
  "access",
  "erasure",
  "portability",
  "rectification",
  "restriction",
  "objection",
] as const;

const requestStatuses = [
  "open",
  "in_progress",
  "awaiting_verification",
  "completed",
  "extended",
  "refused",
  "overdue",
] as const;

export const requestCreateSchema = z.object({
  company_id: z.string().uuid(),
  right_type: z.enum(rightTypes),
  requester_name: z.string().min(2),
  requester_email: z.string().email(),
  description: z.string().optional().nullable(),
  internal_notes: z.string().optional().nullable(),
  received_at: z.coerce.date().optional(),
  source: z.enum(["manual", "intake_form", "email"]).default("manual"),
  assigned_to: z.string().uuid().optional().nullable(),
});

export const requestUpdateSchema = z.object({
  status: z.enum(requestStatuses).optional(),
  assigned_to: z.string().uuid().optional().nullable(),
  internal_notes: z.string().optional().nullable(),
  identity_verified: z.boolean().optional(),
  identity_method: z.string().optional().nullable(),
});

export const requestResponseSchema = z.object({
  template_id: z.string().uuid().optional().nullable(),
  custom_body: z.string().min(1),
  send_email: z.boolean().default(true),
});

export const publicIntakeSchema = z.object({
  token: z.string().min(1),
  right_type: z.enum([
    "access",
    "erasure",
    "portability",
    "rectification",
    "restriction",
    "objection",
    "not_sure",
  ]),
  requester_name: z.string().min(2),
  requester_email: z.string().email(),
  description: z.string().min(5),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  company_name: z.string().min(2),
});

export const onboardingSchema = z.object({
  company_name: z.string().min(2),
  country: z.string().min(2).max(2).default("IT"),
  domain: z.string().optional().nullable(),
});
