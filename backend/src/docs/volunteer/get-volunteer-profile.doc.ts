import { z } from "zod/v4";
import { volunteerSchema } from "./volunteer-shape.doc.js";

export const getVolunteerProfileDoc = {
  tags: ["volunteer"],
  summary: "Get the signed-in volunteer",
  description: "Role volunteer. The registration with its status and the numbers of the panel. Hours are only the ones the coordination validated in the attendance list.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  response: {
    200: z.object({
      message: z.string(),
      volunteer: volunteerSchema.extend({
        user: z.object({ id: z.string(), name: z.string(), email: z.string() }),
        summary: z.object({
          hours_total: z.string().describe("DECIMAL as string.").meta({ example: "96.00" }),
          hours_this_month: z.string().meta({ example: "7.00" }),
          upcoming_shifts: z.number(),
          member_since: z.iso.datetime().nullable().describe("The approval date. Null while not approved."),
        }),
      }),
    }).describe("Volunteer fetched."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: only a volunteer account has a registration."),

    404: z.object({
      error: z.string(),
    }).describe("The account has no volunteer registration."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
