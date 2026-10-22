import { z } from "zod/v4";
import { shiftSchema, validationErrorSchema } from "./volunteer-shift-shape.doc.js";

export const cancelVolunteerShiftDoc = {
  tags: ["volunteer-shift"],
  summary: "Cancel a shift that has not started",
  description: "Admin and communication. Everyone on the shift leaves with it, in the same database transaction, and sees it as cancelled in the panel.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid().describe("Identifier of the shift.").meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      shift: shiftSchema.extend({ released: z.number().describe("Volunteers taken off the shift.") }),
    }).describe("Shift cancelled."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: invalid id, a shift already cancelled or already started."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to coordinate volunteers."),

    404: z.object({
      error: z.string(),
    }).describe("Shift not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
