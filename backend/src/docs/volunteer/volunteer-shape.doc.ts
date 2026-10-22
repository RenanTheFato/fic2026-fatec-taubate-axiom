import { z } from "zod/v4";

// O formato do cadastro de voluntariado, compartilhado pelas rotas do domínio.

export const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const volunteerAreas = z.enum(["ambulatorio", "escola", "oficina", "eventos", "comunicacao", "administrativo", "outra"])

export const volunteerPeriods = z.enum(["manha", "tarde", "noite", "fim-de-semana"])

export const volunteerSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  phone: z.string(),
  city: z.string().nullable(),
  area: volunteerAreas,
  availability: z.array(volunteerPeriods),
  about: z.string(),
  status: z.enum(["pending", "approved", "refused"]),
  review_note: z.string().nullable(),
  reviewed_at: z.iso.datetime().nullable(),
  reviewed_by: z.string().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})
