import { z } from "zod/v4";
import { partnerSchema, validationErrorSchema } from "./partner-shape.doc.js";

export const listPartnerApplicationsDoc = {
  tags: ["partner"],
  summary: "List the partnership requests",
  description: "Admin and communication. Newest first. Partners that joined before the platform show up approved and without an account. pending counts the requests under review, whatever the filter.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  query: z.object({
    status: z.enum(["pending", "approved", "refused"]).optional(),
    page: z.coerce.number().optional().describe("Page number, starting at 1.").meta({ example: 1 }),
    limit: z.coerce.number().optional().describe("Requests per page, at most 50. Defaults to 20.").meta({ example: 20 }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      partners: z.array(partnerSchema.extend({
        user: z.object({ id: z.string(), name: z.string(), email: z.string() }).nullable(),
        reviewer: z.object({ id: z.string(), name: z.string() }).nullable(),
      })),
      total: z.number(),
      pending: z.number(),
    }).describe("Requests fetched."),

    400: validationErrorSchema.describe("Bad Request: invalid query."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to review partnerships."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
