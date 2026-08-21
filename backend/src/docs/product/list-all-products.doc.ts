import { z } from "zod/v4";

const validationErrorSchema = z.object({
  message: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const listAllProductsDoc = {
  tags: ["products"],
  summary: "View all products",
  description: "Fetches the products",
  security: [
    {
      bearerAuth: [],
    },
  ],
  query: z.object({
    page: z.coerce.number().int().positive()
      .optional()
      .describe("Page number, starting at 1.")
      .meta({ example: 1 }),
    limit: z.coerce.number().int().positive().max(50)
      .optional()
      .describe("Items per page, capped at 50.")
      .meta({ example: 20 }),
    search: z.string()
      .optional()
      .describe("Free text matched against the name")
      .meta({ example: "bottle" }),
    avtive: z.boolean()
      .optional()
      .describe("Fetch all, only actives or only non actives"),
  }),
  response: {
    200: z.object({
      message: z.string()
        .describe("Success message."),
      products: z.array(z.object({
        id: z.string(),
        name: z.string(),
        sku: z.string().nullable(),
        description: z.string().nullable(),
        price: z.string(),
        stock: z.number(),
        image_url: z.string().nullable(),
        created_at: z.iso.datetime(),
        updated_at: z.iso.datetime(),
      })),
      total: z.number()
        .describe("Total number of products matching the filter, for pagination."),
    }).describe("Products successfully fetched."),

    400: validationErrorSchema.describe("Bad Request — Validation failure or business rule violation."),

    404: z.object({
      error: z.string(),
    }).describe("Products not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  }
}