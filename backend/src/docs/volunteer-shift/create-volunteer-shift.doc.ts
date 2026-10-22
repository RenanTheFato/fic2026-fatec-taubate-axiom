import { z } from "zod/v4";
import { shiftSchema, validationErrorSchema } from "./volunteer-shift-shape.doc.js";

export const createVolunteerShiftDoc = {
  tags: ["volunteer-shift"],
  summary: "Open a shift in the volunteer scale",
  description: "Admin and communication. The shift shows up for every approved volunteer, who joins it; the slot is reserved at once and the coordination confirms who counts. It starts in the future and lasts at most 12 hours.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  body: z.object({
    activity: z.string().meta({ example: "Apoio na Oficina Terapêutica" }),
    area: z.enum(["ambulatorio", "escola", "oficina", "eventos", "comunicacao", "administrativo", "outra"]),
    place: z.string().meta({ example: "Oficina Terapêutica" }),
    coordinator: z.string().meta({ example: "Coordenação da Oficina" }),
    description: z.string().nullish(),
    starts_at: z.iso.datetime().meta({ example: "2026-11-05T17:00:00.000Z" }),
    ends_at: z.iso.datetime().meta({ example: "2026-11-05T20:00:00.000Z" }),
    slots: z.number().describe("Between 1 and 200.").meta({ example: 4 }),
  }),
  response: {
    201: z.object({
      message: z.string(),
      shift: shiftSchema,
    }).describe("Shift created."),

    400: validationErrorSchema.describe("Bad Request: invalid fields, a start in the past, an end before the start or a shift longer than 12 hours."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to coordinate volunteers."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
