import { z } from "zod/v4";

export const getTransactionStatusDoc = {
  tags: ["transaction"],
  summary: "Follow the status of an order, without login",
  description: "Open endpoint used by the page the payer lands on after the checkout. `GET /transaction/{id}` answers only to admin and finance, and whoever comes back from the gateway has no account: but the interface still must not claim a payment succeeded just because the browser was redirected, so it needs somewhere to ask. The credential is the transaction id itself: a v4 UUID handed only to whoever created the transaction, the same reasoning that makes the receipt hash a credential. The payload is deliberately thin: no donor name, e-mail or document leaves a public route: and the receipt hash only appears once the transaction is confirmed, because before that no document exists.",
  params: z.object({
    id: z.uuid()
      .describe("The transaction id returned by POST /transaction/create.")
      .meta({ example: "8f14e45f-ceea-467a-9b62-3f2c1a5d7e01" }),
  }),
  response: {
    200: z.object({
      message: z.string().describe("Success message."),
      transaction: z.object({
        id: z.uuid(),
        type: z.string().describe("donation, sponsorship, ticket or product."),
        status: z.string()
          .describe("pending, awaiting_confirmation, confirmed, refused, cancelled or refunded. Only confirmed means the money arrived."),
        amount: z.string().describe("DECIMAL as string, never a float."),
        payment_method: z.string().nullable().describe("Filled in by the webhook, so null until the gateway reports it."),
        confirmed_at: z.iso.datetime().nullable(),
        created_at: z.iso.datetime(),
        receipt_hash: z.string().nullable()
          .describe("Null until the transaction is confirmed. It is what /receipt/verify/{hash} and the PDF download take."),
        receipt_number: z.string().nullable().describe("Human readable number printed on the document."),
      }),
    }).describe("Status fetched. A 200 says the order exists, not that it was paid: read status."),

    400: z.object({
      error: z.string(),
      errors: z.array(z.object({ code: z.string(), message: z.string(), path: z.string() })),
    }).describe("The id is not a valid uuid."),

    404: z.object({
      error: z.string(),
    }).describe("No transaction carries this id."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
