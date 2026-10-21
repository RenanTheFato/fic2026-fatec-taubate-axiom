import { z } from "zod/v4";

// O formato de uma inscrição, compartilhado pelas rotas do domínio: cópias divergiriam.

export const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const registrationSchema = z.object({
  id: z.string(),
  event_id: z.string(),
  transaction_id: z.string().nullable().describe("The ticket purchase. Null for a free event."),
  ticket_code: z.string().describe("Ten characters, shown as XXXXX-XXXXX.").meta({ example: "7KQ2M-X9D4R" }),
  participant_name: z.string(),
  participant_email: z.string(),
  participant_phone: z.string().nullable(),
  status: z.enum(["confirmed", "cancelled"]),
  checked_in_at: z.iso.datetime().nullable(),
  checked_in_by: z.string().nullable(),
  cancelled_at: z.iso.datetime().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export const idParams = z.object({
  id: z.uuid().describe("Identifier of the registration.").meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
})

export const codeParams = z.object({
  code: z.string()
    .describe("The ticket code, with or without the hyphen, in any case.")
    .meta({ example: "7KQ2M-X9D4R" }),
})

export const protectedErrors = {
  401: z.object({
    error: z.string(),
  }).describe("Unauthorized: Missing, invalid or expired bearer token."),

  403: z.object({
    error: z.string(),
  }).describe("Forbidden: The authenticated user's role is not allowed to run the event."),

  500: z.object({
    error: z.string(),
  }).describe("Unexpected server error."),
}
