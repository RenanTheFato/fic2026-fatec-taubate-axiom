import { z } from "zod/v4";

const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

const serviceErrorSchema = z.object({
  error: z.string(),
}).describe("A business logic error occurred during product update.")

export const updateProductDoc = {
  tags: ["product"],
  summary: "Update an existing product",
  description: "Updates the editable fields of a product. Stock and the active flag are never changed here. At least one field must be provided. Restricted to users with the admin or communication role.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.string()
      .describe("Public id of the product.")
      .meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  body: z.object({
    name: z.string()
      .optional()
      .describe("Public name of the product.")
      .meta({ example: "Camiseta Somos do Bem" }),
    sku: z.string()
      .nullish()
      .describe("Internal stock keeping unit. Stored uppercase and unique across the catalog.")
      .meta({ example: "CAM-01-M" }),
    description: z.string()
      .nullish()
      .describe("Long description shown on the product page.")
      .meta({ example: "Camiseta 100% algodão, estampa serigrafada." }),
    price: z.number()
      .optional()
      .describe("Unit price, with at most two decimal places.")
      .meta({ example: 89.90 }),
    image_url: z.url()
      .nullish()
      .describe("Absolute url of the product image.")
      .meta({ example: "https://cdn.somosdobem.org/produtos/camiseta.jpg" }),
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
    }).describe("Product updated successfully."),

    400: z.union([validationErrorSchema, serviceErrorSchema])
      .describe("Bad Request — Validation failure or duplicated SKU."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized — Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden — The authenticated user's role is not allowed to update products."),

    404: z.object({
      error: z.string(),
    }).describe("Product not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
