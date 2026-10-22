import { z } from "zod/v4";

// O formato do turno e da participação do voluntário, compartilhado pelas rotas da escala.

export const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const shiftSchema = z.object({
  id: z.string(),
  activity: z.string(),
  area: z.enum(["ambulatorio", "escola", "oficina", "eventos", "comunicacao", "administrativo", "outra"]),
  place: z.string(),
  coordinator: z.string(),
  description: z.string().nullable(),
  starts_at: z.iso.datetime(),
  ends_at: z.iso.datetime(),
  slots: z.number(),
  taken_slots: z.number(),
  status: z.enum(["open", "cancelled"]),
  created_by: z.string().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export const assignmentSchema = z.object({
  id: z.string(),
  shift_id: z.string(),
  volunteer_id: z.string(),
  status: z.enum(["pending", "confirmed", "attended", "absent", "cancelled"]),
  hours: z.string().nullable().describe("Validated hours, DECIMAL as string. Only on attended."),
  checked_at: z.iso.datetime().nullable(),
  checked_by: z.string().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})
