import { z } from "zod/v4";

export const getReceiptDoc = {
  tags: ["receipt"],
  summary: "View one receipt with the transaction behind it",
  description: "Returns a single receipt by its internal identifier, with the transaction that generated it. This is the internal view: the donor document comes back in full, unlike the public verification endpoint. Restricted to admin and finance.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid()
      .describe("Identifier of the receipt.")
      .meta({ example: "b3f8d2a1-5c7e-4d9b-8a06-1e4f7c2b9d53" }),
  }),
  response: {
    200: z.object({
      message: z.string().describe("Success message."),
      receipt: z.object({
        id: z.string(),
        transaction_id: z.string(),
        sequence: z.number().describe("Position in the hash chain."),
        number: z.string(),
        status: z.string(),
        donor_name: z.string(),
        donor_document: z.string().nullable(),
        amount: z.string(),
        transaction_type: z.string(),
        issued_at: z.iso.datetime(),
        cancelled_at: z.iso.datetime().nullable(),
        previous_hash: z.string().nullable().describe("Null only on the first receipt ever issued."),
        hash: z.string(),
        created_at: z.iso.datetime(),
        updated_at: z.iso.datetime(),
        transaction: z.object({
          id: z.string(),
          type: z.string(),
          status: z.string(),
          amount: z.string(),
          payment_method: z.string().nullable(),
          campaign_id: z.string().nullable(),
          event_id: z.string().nullable(),
          confirmed_at: z.iso.datetime().nullable(),
        }).nullable(),
      }),
    }).describe("Receipt fetched successfully."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized. Missing, invalid or expired JWT token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden: Only admin and finance can read a receipt."),

    404: z.object({
      error: z.string(),
    }).describe("Receipt not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
