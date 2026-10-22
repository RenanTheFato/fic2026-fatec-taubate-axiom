import { z } from "zod/v4";
import { assignmentSchema, shiftSchema } from "./volunteer-shift-shape.doc.js";

export const listMyVolunteerShiftsDoc = {
  tags: ["volunteer-shift"],
  summary: "List the shifts of the signed-in volunteer",
  description: "Role volunteer. Every shift the person is on, latest first, plus the upcoming ones the coordination cancelled, so nobody goes to the house for nothing.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  response: {
    200: z.object({
      message: z.string(),
      assignments: z.array(assignmentSchema.extend({ shift: shiftSchema })),
    }).describe("Shifts fetched."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: only a volunteer account has a scale."),

    404: z.object({
      error: z.string(),
    }).describe("The account has no volunteer registration."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
