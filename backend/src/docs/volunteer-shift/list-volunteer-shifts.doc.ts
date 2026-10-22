import { z } from "zod/v4";
import { assignmentSchema, shiftSchema, validationErrorSchema } from "./volunteer-shift-shape.doc.js";

export const listVolunteerShiftsDoc = {
  tags: ["volunteer-shift"],
  summary: "List the volunteer scale",
  description: "Admin and communication. upcoming: shifts that have not ended, soonest first; past: shifts that ended, latest first, where the attendance is recorded. Each shift comes with everyone who joined it, including who left.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  query: z.object({
    scope: z.enum(["upcoming", "past"]).optional().describe("Defaults to upcoming."),
  }),
  response: {
    200: z.object({
      message: z.string(),
      shifts: z.array(shiftSchema.extend({
        assignments: z.array(assignmentSchema.extend({
          volunteer: z.object({
            id: z.string(),
            phone: z.string(),
            area: z.string(),
            user: z.object({ id: z.string(), name: z.string(), email: z.string() }),
          }),
        })),
      })),
    }).describe("Scale fetched."),

    400: validationErrorSchema.describe("Bad Request: invalid query."),

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
