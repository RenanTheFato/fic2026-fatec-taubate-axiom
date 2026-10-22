import { z } from "zod/v4";
import { proposalSchema, validationErrorSchema } from "./partner-proposal-shape.doc.js";

export const withdrawPartnerProposalDoc = {
  tags: ["partner-proposal"],
  summary: "Withdraw a proposal under review",
  description: "Role partner. Only a pending proposal of the company itself; a proposal of another company answers 404.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid().describe("Identifier of the proposal.").meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      proposal: proposalSchema,
    }).describe("Proposal withdrawn."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: invalid id, or the proposal was already answered."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: only a partner account has proposals."),

    404: z.object({
      error: z.string(),
    }).describe("Proposal not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
