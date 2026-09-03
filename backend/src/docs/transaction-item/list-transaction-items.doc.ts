import { z } from "zod/v4";

export const listTransactionItemsDoc = {
  tags: ["transaction-item"],
  summary: "List what was actually sold, line by line",
  description: "Paginated listing of the items of every transaction, newest first, with the transaction and the product already joined. It is the itemisation behind the financial panel: the transaction says how much came in, the item says what it was for. Accepts filters by transaction, product and date range: filtering by product is what answers 'how many of this shirt were sold'. There is no route that creates an item: an item is born inside the checkout, in the same database transaction as the transaction it belongs to, so that no transaction can carry an amount that does not match what was bought. Restricted to admin and finance, like the rest of the money domain.",
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
    transaction_id: z.uuid()
      .optional()
      .describe("Filters by transaction: the itemisation of a single purchase.")
      .meta({ example: "7a2e5c1b-9d3f-4a6e-b810-2c4f7d9a1e53" }),
    product_id: z.uuid()
      .optional()
      .describe("Filters by product: the sales history of one catalogue item.")
      .meta({ example: "5b8d3a1f-4c2e-4b9d-a710-6f3e8c2d5a91" }),
    from: z.coerce.date()
      .optional()
      .describe("Only items created on or after this date.")
      .meta({ example: "2026-01-01T00:00:00.000Z" }),
    to: z.coerce.date()
      .optional()
      .describe("Only items created on or before this date.")
      .meta({ example: "2026-12-31T23:59:59.000Z" }),
  }),
  response: {
    200: z.object({
      message: z.string().describe("Success message."),
      items: z.array(z.object({
        id: z.string(),
        transaction_id: z.string(),
        product_id: z.string().nullable()
          .describe("Null when the item has no physical product behind it, or when the product was later removed from the catalogue."),
        description: z.string()
          .describe("Copy of what was sold, taken at purchase time. This is what always answers what the line refers to, even with no product linked."),
        quantity: z.number(),
        unit_price: z.string()
          .describe("Copy of the price at purchase time. It never follows a later price change in the catalogue."),
        created_at: z.iso.datetime(),
        updated_at: z.iso.datetime(),
        transaction: z.object({
          id: z.string(),
          type: z.string(),
          status: z.string().describe("Only a confirmed transaction represents money that came in."),
          amount: z.string(),
          confirmed_at: z.iso.datetime().nullable(),
        }).nullable(),
        product: z.object({
          id: z.string(),
          name: z.string(),
          sku: z.string().nullable(),
          active: z.boolean(),
        }).nullable(),
      })),
      total: z.number().describe("Total rows matching the filters, ignoring pagination."),
    }).describe("Transaction items fetched successfully."),

    400: z.object({
      error: z.string(),
      errors: z.array(z.object({
        code: z.string(),
        message: z.string(),
        path: z.string(),
      })),
    }).describe("Bad Request: Invalid pagination or filter values."),

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
