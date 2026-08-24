import { z } from "zod/v4";

export const refuseTransactionDoc = {
  tags: ["transaction"],
  summary: "Refuse a transaction",
  description: "Marks a pending transaction as refused. Nothing financial is reversed because nothing was applied yet — the seat and the campaign total are only touched on confirmation. Restricted to admin and finance.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid()
      .describe("Identifier of the transaction.")
      .meta({ example: "7a2e5c1b-9d3f-4a6e-b810-2c4f7d9a1e53" }),
  }),
  body: z.object({
    reason: z.string()
      .nullish()
      .describe("Why the change was made. Stored in the audit log, which every status change writes — rule 3.1 forbids a status UPDATE without one.")
      .meta({ example: "Comprovante conferido no extrato do dia 12/09." }),
  }),
  response: {
    200: z.object({
      message: z.string().describe("Success message."),
      transaction: z.object({
        id: z.string(),
        type: z.string(),
        status: z.string(),
        amount: z.string(),
        payment_method: z.string().nullable(),
        donor_id: z.string(),
        campaign_id: z.string().nullable(),
        event_id: z.string().nullable(),
        gateway_checkout_id: z.string().nullable(),
        gateway_payment_id: z.string().nullable(),
        checkout_url: z.string().nullable(),
        notes: z.string().nullable(),
        confirmed_at: z.iso.datetime().nullable(),
        refunded_at: z.iso.datetime().nullable(),
        created_at: z.iso.datetime(),
        updated_at: z.iso.datetime(),
      }),
    }).describe("Status changed successfully."),

    400: z.object({
      error: z.string(),
    }).describe("Bad Request — The transaction is not pending or awaiting confirmation."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized. Missing, invalid or expired JWT token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden — Only admin and finance can move a transaction by hand."),

    404: z.object({
      error: z.string(),
    }).describe("Transaction not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
