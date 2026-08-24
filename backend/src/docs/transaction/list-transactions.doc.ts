import { z } from "zod/v4";
import { TRANSACTION_STATUSES, TRANSACTION_TYPES } from "../../models/transaction-model.js";

export const listTransactionsDoc = {
  tags: ["transaction"],
  summary: "List transactions for the financial panel",
  description: "Paginated listing of every transaction, newest first, with the donor, campaign and event already joined. Accepts filters by status, type, campaign, event, donor and date range — this is the single panel that replaces the spreadsheets the NGO keeps today. Restricted to admin and finance: the listing carries donor data, which rule 3.6 keeps out of public endpoints.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  query: z.object({
    page: z.coerce.number()
      .optional()
      .describe("Page number, starting at 1.")
      .meta({ example: 1 }),
    limit: z.coerce.number()
      .optional()
      .describe("How many rows per page. Defaults to 20, capped at 50.")
      .meta({ example: 20 }),
    status: z.enum(TRANSACTION_STATUSES)
      .optional()
      .describe("Filters by lifecycle status.")
      .meta({ example: "confirmed" }),
    type: z.enum(TRANSACTION_TYPES)
      .optional()
      .describe("Filters by what was paid for.")
      .meta({ example: "donation" }),
    campaign_id: z.uuid()
      .optional()
      .describe("Filters by campaign.")
      .meta({ example: "9f1d4c2e-6b7a-4d3f-8c21-0a5e7b9d1c34" }),
    event_id: z.uuid()
      .optional()
      .describe("Filters by event.")
      .meta({ example: "3c6b1f9e-2a4d-4e7b-8f10-5d9c2a7b3e61" }),
    donor_id: z.uuid()
      .optional()
      .describe("Filters by donor — the donation history of one person.")
      .meta({ example: "5b8d3a1f-4c2e-4b9d-a710-6f3e8c2d5a91" }),
    from: z.coerce.date()
      .optional()
      .describe("Only transactions created on or after this date.")
      .meta({ example: "2026-01-01T00:00:00.000Z" }),
    to: z.coerce.date()
      .optional()
      .describe("Only transactions created on or before this date.")
      .meta({ example: "2026-12-31T23:59:59.000Z" }),
  }),
  response: {
    200: z.object({
      message: z.string().describe("Success message."),
      transactions: z.array(z.object({
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
        }).nullable(),
      })),
      total: z.number().describe("Total rows matching the filters, ignoring pagination."),
    }).describe("Transactions fetched successfully."),

    400: z.object({
      error: z.string(),
      errors: z.array(z.object({
        code: z.string(),
        message: z.string(),
        path: z.string(),
      })),
    }).describe("Bad Request — Invalid pagination or filter values."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized. Missing, invalid or expired JWT token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden — Only admin and finance can read the financial panel."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
