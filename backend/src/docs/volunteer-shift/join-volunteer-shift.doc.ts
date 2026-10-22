import { z } from "zod/v4";
import { assignmentSchema, validationErrorSchema } from "./volunteer-shift-shape.doc.js";

export const joinVolunteerShiftDoc = {
  tags: ["volunteer-shift"],
  summary: "Join an open shift",
  description: "Role volunteer, approved only. The slot is taken by a conditional UPDATE, like an event seat: whoever comes after the last one gets 400. The participation waits for the coordination to confirm.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid().describe("Identifier of the shift.").meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  response: {
    201: z.object({
      message: z.string(),
      assignment: assignmentSchema,
    }).describe("Joined the shift."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: invalid id, a shift that already started, no slots left, or already on it."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: only an approved volunteer reaches the scale."),

    404: z.object({
      error: z.string(),
    }).describe("Shift not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
