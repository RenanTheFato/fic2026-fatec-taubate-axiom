import { z } from "zod/v4";
import { TRANSACTION_TYPES } from "../../models/transaction-model.js";

export const summarizeTransactionItemsDoc = {
  tags: ["transaction-item"],
  summary: "How much each product sold and how much it brought in",
  description: "Aggregation of the itemisation: one line per product with the quantity sold, the revenue and how many transactions it appeared in, ordered by revenue. It answers the question the plain listing cannot: 'how many shirts did we sell and what did that raise': and feeds the shop report of the transparency portal. Only confirmed transactions count: a pending checkout never brought money in, and a refund moves the transaction out of 'confirmed', so it leaves the report on its own. The date range filters on the confirmation date, not on when the item was written, because that is when the money actually arrived. Restricted to admin and finance, like the rest of the money domain.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  query: z.object({
    product_id: z.uuid()
      .optional()
      .describe("Restricts the report to a single catalogue item.")
      .meta({ example: "5b8d3a1f-4c2e-4b9d-a710-6f3e8c2d5a91" }),
    type: z.enum(TRANSACTION_TYPES)
      .optional()
      .describe("Restricts the report to one kind of transaction: 'product' for the shop, 'ticket' for event admissions.")
      .meta({ example: "product" }),
    from: z.coerce.date()
      .optional()
      .describe("Only transactions confirmed on or after this date.")
      .meta({ example: "2026-01-01T00:00:00.000Z" }),
    to: z.coerce.date()
      .optional()
      .describe("Only transactions confirmed on or before this date.")
      .meta({ example: "2026-12-31T23:59:59.000Z" }),
  }),
  response: {
    200: z.object({
      message: z.string().describe("Success message."),
      summary: z.array(z.object({
        product_id: z.string().nullable()
          .describe("Null when the line has no catalogue product behind it, or when the product was later removed. Use it to drill down into /transaction-item/list."),
        description: z.string()
          .describe("The name the item was sold under, taken at purchase time. A product renamed halfway through the period appears as two lines, because that is what the receipts already in the donors' hands say."),
        quantity: z.number()
          .describe("Units sold across the period."),
        revenue: z.string()
          .describe("Sum of quantity times unit price, added up in SQL so it never drifts from the ledger. '0.00' when nothing matched."),
        transactions: z.number()
          .describe("How many distinct confirmed transactions contained this item."),
      })).describe("One line per product, ordered by revenue, then by quantity."),
      totals: z.object({
        products: z.number().describe("How many distinct lines the report has."),
        quantity: z.number().describe("Units sold across every line."),
        revenue: z.string().describe("Total revenue across every line."),
        transactions: z.number()
          .describe("Distinct confirmed transactions covered by the report. It is not the sum of the per-line counts: one transaction carrying a shirt and a mug is counted once here and once on each line."),
      }),
    }).describe("Transaction items summarized successfully."),

    400: z.object({
      error: z.string(),
      errors: z.array(z.object({
        code: z.string(),
        message: z.string(),
        path: z.string(),
      })),
    }).describe("Bad Request: Invalid filter values."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized. Missing, invalid or expired JWT token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden: Only admin and finance can read the itemisation."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
