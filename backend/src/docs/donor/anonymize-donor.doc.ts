import { z } from "zod/v4";

export const anonymizeDonorDoc = {
  tags: ["donor"],
  summary: "Anonymize a donor on a data removal request",
  description: "Replaces the personal data of a donor with markers and unlinks the account, stamping anonymized_at. The row itself survives and every transaction keeps pointing to it with the amount and date intact: there is no DELETE for a donor, because removing one would leave an orphan receipt and break the financial history. This is the correct answer to an LGPD erasure request. Restricted to the admin role.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid()
      .describe("Identifier of the donor.")
      .meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  response: {
    200: z.object({
      message: z.string().describe("Success message."),
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
    }).describe("Donor anonymized successfully."),

    400: z.object({
      error: z.string(),
    }).describe("Bad Request: The donor has already been anonymized."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized. Missing, invalid or expired JWT token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden: Only the admin role can anonymize a donor."),

    404: z.object({
      error: z.string(),
    }).describe("Donor not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
