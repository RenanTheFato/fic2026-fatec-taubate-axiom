import { z } from "zod/v4";

// O formato de uma mensagem, compartilhado pelas cinco rotas do domínio: cópias divergiriam.

export const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const receivedSchema = z.object({
  id: z.string(),
  channel: z.enum(["contact", "ombudsman", "work", "wall_removal"]),
  created_at: z.iso.datetime(),
})

export const contactSchema = z.object({
  id: z.string(),
  channel: z.enum(["contact", "ombudsman", "work", "wall_removal"]),
  subject: z.string().nullable().describe("Option key of the form, such as doacao or reclamacao. Null on a wall removal request."),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  message: z.string().nullable(),
  status: z.enum(["open", "resolved"]),
  resolved_at: z.iso.datetime().nullable(),
  resolved_by: z.string().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})
