import { z } from "zod/v4";
import { proposalKinds, proposalSchema, validationErrorSchema } from "./partner-proposal-shape.doc.js";

export const createPartnerProposalDoc = {
  tags: ["partner-proposal"],
  summary: "Suggest something to the association",
  description: "Role partner, approved company only. campaign suggests a new campaign; contribution is money for a campaign or for the association; sponsorship is money for a campaign or an event; in_kind offers products or services; volunteering offers a day of the company team. Contribution and sponsorship need the amount, and their campaign or event must be receiving money today. The proposal is born pending: nothing reaches the cash until the association accepts it and the company pays.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  body: z.object({
    kind: proposalKinds,
    title: z.string().describe("Between 5 and 160 characters.").meta({ example: "Patrocínio do Chefs do Bem" }),
    description: z.string().describe("Between 20 and 3000 characters."),
    amount: z.number().nullish().describe("At most two decimals.").meta({ example: 5000 }),
    campaign_id: z.uuid().nullish(),
    event_id: z.uuid().nullish(),
  }),
  response: {
    201: z.object({
      message: z.string(),
      proposal: proposalSchema,
    }).describe("Proposal sent."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: invalid fields, missing amount, a sponsorship without target, or a campaign or event that is not receiving money."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: the company is not approved, or the account is not a partner."),

    404: z.object({
      error: z.string(),
    }).describe("The account has no company."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
