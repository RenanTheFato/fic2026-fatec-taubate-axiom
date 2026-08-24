import { z } from "zod/v4";

export const getTransactionDoc = {
  tags: ["transaction"],
  summary: "View one transaction with its full audit trail",
  description: "Returns a single transaction with the donor, campaign, event and the complete audit log in chronological order. The audit log is what makes rule 3.1 verifiable: every status change appears with its previous status, its source (webhook, manual, reconciliation or system), who did it and why. Restricted to admin and finance.",
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
        donor: z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
          document: z.string().nullable(),
          document_type: z.string().nullable(),
          phone: z.string().nullable(),
        }).nullable(),
        campaign: z.object({
          id: z.string(),
          title: z.string(),
          slug: z.string(),
        }).nullable(),
        event: z.object({
          id: z.string(),
          title: z.string(),
          slug: z.string(),
          starts_at: z.iso.datetime(),
        }).nullable(),
        audit_logs: z.array(z.object({
          id: z.string(),
          transaction_id: z.string(),
          previous_status: z.string().nullable().describe("Null on the record that created the transaction."),
          new_status: z.string(),
          source: z.string().describe("webhook, manual, reconciliation or system."),
          performed_by: z.string().nullable().describe("Null when the change came from the gateway, not from a person."),
          reason: z.string().nullable(),
          created_at: z.iso.datetime(),
        })),
      }),
    }).describe("Transaction fetched successfully."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized. Missing, invalid or expired JWT token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden — Only admin and finance can read a transaction."),

    404: z.object({
      error: z.string(),
    }).describe("Transaction not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
