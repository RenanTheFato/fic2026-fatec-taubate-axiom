import { z } from "zod/v4";

export const deactivateProductDoc = {
  tags: ["product"],
  summary: "Deactivate an Product",
  description: "Turn an active product into an deactivate and private",
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
    200: z.object({
      message: z.string()
    }).describe("Deactivated sucessful"),

    400: z.object({
      error: z.string(),
    }).describe("Bad Request — Validation failure or business rule violation."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized. Missing, invalid or expired JWT token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden — The authenticated user's role is not allowed to deactivate products."),

    404: z.object({
      error: z.string(),
    }).describe("Product not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}