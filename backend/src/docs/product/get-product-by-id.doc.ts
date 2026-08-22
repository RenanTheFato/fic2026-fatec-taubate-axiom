import { z } from "zod/v4";

const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const getProductByIdDoc = {
  tags: ["product"],
  summary: "Get Product By Id",
  description: "Fetch one product information by id",
  params: z.object({
    id: z.string()
      .describe("Public id of the product.")
      .meta({ example: "yoipu1-1273obn-1y263781" }),
  }),
  response: {
    200: z.object({
      message: z.string()
        .describe("Success message."),
      product: z.object({
        id: z.string(),
        name: z.string(),
        sku: z.string().nullable(),
        description: z.string().nullable(),
        price: z.string(),
        stock: z.number(),
        image_url: z.string().nullable(),
        created_at: z.iso.datetime(),
        updated_at: z.iso.datetime(),
      }),
    }).describe("Product successfully founded."),

    400: validationErrorSchema.describe("Bad Request — Validation failure or business rule violation."),

    404: z.object({
      error: z.string(),
    }).describe("Product not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  }
}