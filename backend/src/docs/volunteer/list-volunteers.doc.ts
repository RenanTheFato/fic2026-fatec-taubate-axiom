import { z } from "zod/v4";
import { volunteerSchema, validationErrorSchema } from "./volunteer-shape.doc.js";

export const listVolunteersDoc = {
  tags: ["volunteer"],
  summary: "List the volunteer registrations",
  description: "Admin and communication. Newest first, each with the validated hours. pending counts the registrations under review, whatever the filter.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  query: z.object({
    status: z.enum(["pending", "approved", "refused"]).optional(),
    page: z.coerce.number().optional().describe("Page number, starting at 1.").meta({ example: 1 }),
    limit: z.coerce.number().optional().describe("Registrations per page, at most 50. Defaults to 20.").meta({ example: 20 }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      volunteers: z.array(volunteerSchema.extend({
        user: z.object({ id: z.string(), name: z.string(), email: z.string() }),
        reviewer: z.object({ id: z.string(), name: z.string() }).nullable(),
        hours_total: z.string(),
      })),
      total: z.number(),
      pending: z.number(),
    }).describe("Registrations fetched."),

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
