import { z } from "zod/v4";

// O formato de uma proposta de parceiro, compartilhado pelas rotas do domínio.

export const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const proposalKinds = z.enum(["campaign", "contribution", "sponsorship", "in_kind", "volunteering"])

export const proposalSchema = z.object({
  id: z.string(),
  partner_id: z.string(),
  kind: proposalKinds,
  title: z.string(),
  description: z.string(),
  amount: z.string().nullable().describe("DECIMAL as string. Required on contribution and sponsorship."),
  campaign_id: z.string().nullable(),
  event_id: z.string().nullable(),
  status: z.enum(["pending", "accepted", "refused", "withdrawn"]),
  response_note: z.string().nullable(),
  reviewed_at: z.iso.datetime().nullable(),
  reviewed_by: z.string().nullable(),
  transaction_id: z.string().nullable().describe("The payment of an accepted contribution or sponsorship."),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export const targetSchema = z.object({ id: z.string(), title: z.string(), slug: z.string() }).nullable()
