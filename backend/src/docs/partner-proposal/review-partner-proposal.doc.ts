import { z } from "zod/v4";
import { proposalSchema, validationErrorSchema } from "./partner-proposal-shape.doc.js";

export const reviewPartnerProposalDoc = {
  tags: ["partner-proposal"],
  summary: "Accept or refuse a proposal",
  description: "Admin and communication. Only a pending proposal, and always with a note of at least 10 characters: the reason of a refusal, or how an accepted proposal goes on. Accepting a contribution or a sponsorship lets the company pay it in its panel.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid().describe("Identifier of the proposal.").meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  body: z.object({
    decision: z.enum(["accepted", "refused"]),
    note: z.string().describe("Between 10 and 2000 characters.").meta({ example: "Aceito! O patrocínio entra no material do evento. O pagamento já está liberado no seu painel." }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      proposal: proposalSchema,
    }).describe("Proposal answered."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: invalid fields, or the proposal was already answered."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to answer proposals."),

    404: z.object({
      error: z.string(),
    }).describe("Proposal not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
