import { z } from "zod/v4";
import { partnerInterests, partnerSchema, validationErrorSchema } from "./partner-shape.doc.js";

export const resubmitPartnerDoc = {
  tags: ["partner"],
  summary: "Send a refused request again",
  description: "Role partner. A refused company reviews its message and interests and sends the request again, with the same account. It goes back to the association's queue as pending.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  body: z.object({
    interests: z.array(partnerInterests),
    message: z.string().describe("Between 20 and 3000 characters."),
  }),
  response: {
    200: z.object({
      message: z.string(),
      partner: partnerSchema,
    }).describe("Request sent again."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: invalid fields, or the request is not refused."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: only a partner account has a request."),

    404: z.object({
      error: z.string(),
    }).describe("The account has no company."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
