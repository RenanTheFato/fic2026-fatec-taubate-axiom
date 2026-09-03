import { z } from "zod/v4";

export const deleteProductDoc = {
  tags: ["product"],
  summary: "Delete a product",
  description: "Permanently removes a product that has never been activated. A product that was activated at least once, even if currently deactivated, cannot be deleted: use deactivate instead. Only by admins.",
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
  response: {
    204: z.object({}).describe("Deleted successfully, no content on response."),

    400: z.object({
      error: z.string(),
    }).describe("Bad Request: The product has already been activated at some point."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized. Missing, invalid or expired JWT token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden: The authenticated user's role is not allowed to delete products."),

    404: z.object({
      error: z.string(),
    }).describe("Product not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
