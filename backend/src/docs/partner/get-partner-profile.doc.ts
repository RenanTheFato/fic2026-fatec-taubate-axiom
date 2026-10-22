import { z } from "zod/v4";
import { partnerSchema } from "./partner-shape.doc.js";

export const getPartnerProfileDoc = {
  tags: ["partner"],
  summary: "Get the signed-in company",
  description: "Role partner. The company of the token, with the request status, the review note and the return numbers: proposals per status and what actually arrived, summed by the database over the confirmed transactions of its proposals.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  response: {
    200: z.object({
      message: z.string(),
      partner: partnerSchema.extend({
        user: z.object({ id: z.string(), name: z.string(), email: z.string() }),
        summary: z.object({
          proposals: z.object({
            pending: z.number(),
            accepted: z.number(),
            refused: z.number(),
            withdrawn: z.number(),
          }),
          contributed: z.string().describe("Sum of the confirmed payments, DECIMAL as string.").meta({ example: "5000.00" }),
          contributions: z.number(),
        }),
      }),
    }).describe("Company fetched."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: only a partner account has a company."),

    404: z.object({
      error: z.string(),
    }).describe("The account has no company."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
