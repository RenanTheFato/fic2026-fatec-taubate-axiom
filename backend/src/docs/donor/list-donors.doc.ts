import { z } from "zod/v4";

const validationErrorSchema = z.object({
  message: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const listDonorsDoc = {
  tags: ["donors"],
  summary: "View all donors",
  description: "Fetches the donors",
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
  }),
  response: {
    200: z.object({
      message: z.string()
        .describe("Success message."),
      donors: z.array(z.object({
        id: z.string(),
        user_id: z.string(),
        name: z.string(),
        email: z.string(),
        document: z.string(),
        document_type: z.string(),
        phone: z.string(),
        created_at: z.iso.datetime(),
        updated_at: z.iso.datetime(),
      })),
      total: z.number()
        .describe("Total number of donors matching the filter, for pagination."),
    }).describe("Donors successfully fetched."),

    400: validationErrorSchema.describe("Bad Request — Validation failure or business rule violation."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized. Missing, invalid or expired JWT token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden — The authenticated user's role is not allowed to see the donors."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  }
}