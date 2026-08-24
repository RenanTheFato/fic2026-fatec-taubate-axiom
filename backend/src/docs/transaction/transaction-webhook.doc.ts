import { z } from "zod/v4";

export const transactionWebhookDoc = {
  tags: ["transaction"],
  summary: "Receive a Stripe payment notification",
  description: "Called by Stripe, never by a user, which is why it carries no bearer token — the stripe-signature header is what authenticates it, and an invalid or stale signature is rejected with 401 before any database read. The body reaches this route as the raw bytes Stripe signed, so it is not validated by a Zod schema: the signature check is the validation. The event alone does not drive the money either — for a successful payment the PaymentIntent is fetched back from the Stripe API and that answer drives the transition, as rule 3.1 of the plan requires. Delivery is repeated by the gateway on purpose, so the route is idempotent: an event that lands on a status the transaction already has is acknowledged and ignored instead of being applied twice. An unknown transaction also answers 200, because any error status would make Stripe retry the same event for days.",
  body: z.object({
    id: z.string()
      .describe("Stripe event id, recorded in the audit log as the reason for the transition.")
      .meta({ example: "evt_1PabcDEfGhIjKlMn" }),
    type: z.string()
      .describe("Event type. Only checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed, checkout.session.expired, payment_intent.payment_failed and charge.refunded change a transaction; anything else is acknowledged and ignored.")
      .meta({ example: "checkout.session.completed" }),
    data: z.object({
      object: z.record(z.string(), z.unknown())
        .describe("The Checkout Session, PaymentIntent or Charge the event is about. The transaction is found by its client_reference_id or by the transaction_id in the PaymentIntent metadata."),
    }),
  }).describe("Sent by Stripe as a raw JSON body. Shown here for reference only — this route reads the raw bytes, never a parsed schema."),
  response: {
    200: z.object({
      message: z.string(),
      processed: z.boolean().describe("False when the event was a repeat, an unhandled type or an unknown transaction."),
      status: z.string().optional().describe("The transaction status after processing."),
      reason: z.string().optional().describe("Why nothing was processed."),
    }).describe("Event acknowledged. Always answered when the signature is valid, whether or not anything changed."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized — The stripe-signature header is missing, does not match the webhook secret, or is outside the tolerated timestamp window."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error, including a failure reaching the Stripe API."),
  },
}
