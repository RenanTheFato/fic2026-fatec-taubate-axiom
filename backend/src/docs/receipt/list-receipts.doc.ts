import { z } from "zod/v4";
import { RECEIPT_STATUSES } from "../../models/receipt-model.js";
import { TRANSACTION_TYPES } from "../../models/transaction-model.js";

export const listReceiptsDoc = {
  tags: ["receipt"],
  summary: "List issued receipts for the financial panel",
  description: "Paginated listing of every receipt, newest first, ordered by its position in the hash chain. There is no endpoint that issues a receipt: a receipt is born inside the confirmation of a transaction, in the same database transaction, so that a document can never exist without a confirmed payment behind it. Restricted to admin and finance — the listing carries the donor name and document in full.",
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
    status: z.enum(RECEIPT_STATUSES)
      .optional()
      .describe("issued or cancelled. A cancelled receipt is one whose transaction was refunded.")
      .meta({ example: "issued" }),
    transaction_type: z.enum(TRANSACTION_TYPES)
      .optional()
      .describe("Filters by what the receipt refers to.")
      .meta({ example: "donation" }),
    from: z.coerce.date()
      .optional()
      .describe("Only receipts issued on or after this date.")
      .meta({ example: "2026-01-01T00:00:00.000Z" }),
    to: z.coerce.date()
      .optional()
      .describe("Only receipts issued on or before this date.")
      .meta({ example: "2026-12-31T23:59:59.000Z" }),
  }),
  response: {
    200: z.object({
      message: z.string().describe("Success message."),
      receipts: z.array(z.object({
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
        previous_hash: z.string().nullable(),
        hash: z.string(),
        created_at: z.iso.datetime(),
        updated_at: z.iso.datetime(),
        transaction: z.object({
          id: z.string(),
          type: z.string(),
          status: z.string(),
          campaign_id: z.string().nullable(),
          event_id: z.string().nullable(),
        }).nullable(),
      })),
      total: z.number().describe("Total rows matching the filters, ignoring pagination."),
    }).describe("Receipts fetched successfully."),

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
    }).describe("Forbidden — Only admin and finance can read issued receipts."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
