import { z } from "zod/v4";
import { validationErrorSchema } from "./partner-proposal-shape.doc.js";

export const payPartnerProposalDoc = {
  tags: ["partner-proposal"],
  summary: "Pay an accepted contribution or sponsorship",
  description: "Role partner. Creates the transaction (sponsorship, or donation for a contribution) with the company as donor, its CNPJ on the receipt, and returns the gateway checkout. Only the webhook confirms the payment, sums the campaign and issues the receipt. A second call while the payment is still pending returns the same checkout instead of opening another charge.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid().describe("Identifier of the proposal.").meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  response: {
    201: z.object({
      message: z.string(),
      payment: z.object({
        transaction_id: z.string(),
        checkout_url: z.string().nullable().describe("Where to send the browser."),
      }),
    }).describe("Checkout created."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: not accepted, not payable, already paid or being processed, or a campaign or event that stopped receiving money."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: the company is not approved, or the account is not a partner."),

    404: z.object({
      error: z.string(),
    }).describe("Proposal not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
