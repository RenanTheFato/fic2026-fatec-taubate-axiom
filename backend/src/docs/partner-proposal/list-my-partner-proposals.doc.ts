import { z } from "zod/v4";
import { proposalSchema, targetSchema } from "./partner-proposal-shape.doc.js";

export const listMyPartnerProposalsDoc = {
  tags: ["partner-proposal"],
  summary: "List the proposals of the signed-in company",
  description: "Role partner. Newest first, each with its campaign or event and, once paid, the payment and the receipt (number and hash, which open the public verification and the certificate second copy).",
  security: [
    {
      bearerAuth: [],
    },
  ],
  response: {
    200: z.object({
      message: z.string(),
      proposals: z.array(proposalSchema.omit({ transaction_id: true }).extend({
        campaign: targetSchema,
        event: targetSchema,
        payment: z.object({
          transaction_id: z.string(),
          status: z.enum(["pending", "awaiting_confirmation", "confirmed", "refused", "cancelled", "refunded"]),
          amount: z.string(),
          receipt: z.object({ number: z.string(), hash: z.string(), status: z.enum(["issued", "cancelled"]) }).nullable(),
        }).nullable(),
      })),
    }).describe("Proposals fetched."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: only a partner account has proposals."),

    404: z.object({
      error: z.string(),
    }).describe("The account has no company."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
