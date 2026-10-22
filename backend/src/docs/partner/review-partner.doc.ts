import { z } from "zod/v4";
import { partnerSchema, validationErrorSchema } from "./partner-shape.doc.js";

export const reviewPartnerDoc = {
  tags: ["partner"],
  summary: "Approve or refuse a partnership request",
  description: "Admin and communication. Only a pending request. Approving opens the full panel of the company; refusing requires a reason of at least 10 characters, which the company reads in its panel.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid().describe("Identifier of the partner.").meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  body: z.object({
    decision: z.enum(["approved", "refused"]),
    note: z.string().nullish().describe("Required on a refusal.").meta({ example: "Bem-vindos à rede! A equipe de captação vai ligar nesta semana." }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      partner: partnerSchema,
    }).describe("Request reviewed."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: invalid fields, refusal without a reason, or a request already reviewed."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to review partnerships."),

    404: z.object({
      error: z.string(),
    }).describe("Request not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
