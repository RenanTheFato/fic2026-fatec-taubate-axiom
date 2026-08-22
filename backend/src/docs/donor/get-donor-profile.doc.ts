import { z } from "zod/v4";

export const getDonorProfileDoc = {
  tags: ["donor"],
  summary: "View the donor record of the authenticated user",
  description: "Fetches the donor linked to the currently authenticated account, taken from the token and never from a path param. Answers 404 for an account that has never donated, since no donor record exists yet.",
  security: [
    {
      bearerAuth: []
    }
  ],
  response: {
    200: z.object({
      message: z.string()
        .describe("Success message."),
      donor: z.object({
        id: z.string(),
        user_id: z.string().nullable(),
        name: z.string(),
        email: z.string(),
        document: z.string().nullable(),
        document_type: z.string().nullable(),
        phone: z.string().nullable(),
        anonymized_at: z.iso.datetime().nullable(),
        created_at: z.iso.datetime(),
        updated_at: z.iso.datetime(),
      }),
    }).describe("Donor data successfully fetched."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized. Missing, invalid or expired JWT token."),

    404: z.object({
      error: z.string(),
    }).describe("The authenticated account has no donor record linked to it."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  }
}
