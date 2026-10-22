import { z } from "zod/v4";
import { proposalKinds, proposalSchema, targetSchema, validationErrorSchema } from "./partner-proposal-shape.doc.js";

export const listPartnerProposalsDoc = {
  tags: ["partner-proposal"],
  summary: "List the proposals of every partner",
  description: "Admin and communication. Newest first, with the company, the target and the payment status of accepted contributions and sponsorships. pending counts the proposals under review, whatever the filters.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  query: z.object({
    status: z.enum(["pending", "accepted", "refused", "withdrawn"]).optional(),
    kind: proposalKinds.optional(),
    page: z.coerce.number().optional().describe("Page number, starting at 1.").meta({ example: 1 }),
    limit: z.coerce.number().optional().describe("Proposals per page, at most 50. Defaults to 20.").meta({ example: 20 }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      proposals: z.array(proposalSchema.extend({
        partner: z.object({
          id: z.string(),
          company_name: z.string(),
          phone: z.string().nullable(),
          user: z.object({ id: z.string(), name: z.string(), email: z.string() }).nullable(),
        }),
        campaign: targetSchema,
        event: targetSchema,
        transaction: z.object({ id: z.string(), status: z.string(), amount: z.string() }).nullable(),
        reviewer: z.object({ id: z.string(), name: z.string() }).nullable(),
      })),
      total: z.number(),
      pending: z.number(),
    }).describe("Proposals fetched."),

    400: validationErrorSchema.describe("Bad Request: invalid query."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to answer proposals."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
