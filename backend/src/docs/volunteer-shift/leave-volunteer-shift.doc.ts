import { z } from "zod/v4";
import { assignmentSchema, validationErrorSchema } from "./volunteer-shift-shape.doc.js";

export const leaveVolunteerShiftDoc = {
  tags: ["volunteer-shift"],
  summary: "Leave a shift that has not started",
  description: "Role volunteer. The slot goes back to the scale.",
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
      assignment: assignmentSchema,
    }).describe("Left the shift."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: invalid id, a shift that already started, or attendance already recorded."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: only a volunteer account has a scale."),

    404: z.object({
      error: z.string(),
    }).describe("Not on this shift."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
