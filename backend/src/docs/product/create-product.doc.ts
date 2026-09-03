import { z } from "zod/v4";

const validationErrorSchema = z.object({
  message: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

const serviceErrorSchema = z.object({
  error: z.string(),
}).describe("A business logic error occurred during product creation.")

const internalErrorSchema = z.object({
  error: z.string(),
}).describe("Unexpected internal server error.")

export const createProductDoc = {
  tags: ["product"],
  summary: "Create a new store product",
  description: "Registers a new product in the store catalog. The product is created inactive and stays out of the public listing until it is activated. Restricted to users with the admin or communication role.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  body: z.object({
    name: z.string()
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
      .describe("Unit price, with at most two decimal places.")
      .meta({ example: 89.90 }),
    stock: z.number()
      .optional()
      .describe("Units available. Defaults to zero.")
      .meta({ example: 50 }),
    image_url: z.url()
      .nullish()
      .describe("Absolute url of the product image.")
      .meta({ example: "https://cdn.somosdobem.org/produtos/camiseta.jpg" }),
  }),
  response: {
    201: z.object({
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
    }).describe("Product created successfully."),

    400: z.union([validationErrorSchema, serviceErrorSchema])
      .describe("Bad Request: Validation failure or duplicated SKU."),

    401: z.object({
      error: z.string()
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden: The authenticated user's role is not allowed to create products."),

    500: internalErrorSchema.describe("Internal Server Error: Unexpected failure during product creation."),
  },
}
