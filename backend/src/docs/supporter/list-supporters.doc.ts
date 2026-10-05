import { z } from "zod/v4";

const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const listSupportersDoc = {
  tags: ["supporter"],
  summary: "List everyone who supported the association",
  description: "Public. The site-wide wall: every campaign, every event and every standalone donation. Names appear only with the donor's consent (public_recognition), for confirmed and not refunded contributions, and never for an anonymized donor. The order is random and never derived from the amount given.",
  query: z.object({
    seed: z.string().optional()
      .describe("Shuffle seed. The same seed always returns the same order, so pages never repeat or skip a name. Omit it on the first page and send back the one the response returns.")
      .meta({ example: "9f3a1c7b2e40" }),
    page: z.coerce.number().optional().describe("Page number, starting at 1.").meta({ example: 1 }),
    limit: z.coerce.number().optional().describe("Names per page, at most 300. Defaults to 120.").meta({ example: 120 }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      supporters: z.array(z.object({
        name: z.string(),
      })).describe("Names in random order. No amount, date or count of contributions is ever returned."),
      total: z.number().describe("People and companies listed, across all pages."),
      contributors: z.number().describe("Everyone who contributed, including those who chose not to be listed."),
      seed: z.string().describe("The seed that produced this order."),
    }).describe("Supporters fetched."),

    400: validationErrorSchema.describe("Bad Request: invalid query."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
