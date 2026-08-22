import { z } from "zod/v4";

const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const updateProductStockDoc = {
  tags: ["product"],
  summary: "Adjust a product's stock",
  description: "Sets the product's stock to the given absolute quantity, as counted on the shelf during an inventory check. This is not a delta — sending the same value twice does not change the stock twice. Restricted to users with the admin or staff role.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid()
      .describe("Identifier of the product.")
      .meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  body: z.object({
    stock: z.number()
      .describe("Absolute quantity available, as counted on the shelf.")
      .meta({ example: 35 }),
  }),
  response: {
    200: z.object({
      message: z.string().describe("Success message."),
      product: z.object({
        id: z.string(),
        name: z.string(),
        sku: z.string().nullable(),
        description: z.string().nullable(),
        price: z.string(),
        stock: z.number(),
        image_url: z.string().nullable(),
        active: z.boolean(),
        activated_at: z.iso.datetime().nullable(),
        created_at: z.iso.datetime(),
        updated_at: z.iso.datetime(),
      }),
    }).describe("Product stock updated successfully."),

    400: validationErrorSchema.describe("Bad Request — Validation failure."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized — Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden — The authenticated user's role is not allowed to adjust product stock."),

    404: z.object({
      error: z.string(),
    }).describe("Product not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
