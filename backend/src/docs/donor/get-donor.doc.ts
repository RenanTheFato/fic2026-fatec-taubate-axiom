import { z } from "zod/v4";

const validationErrorSchema = z.object({
  message: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const getDonorDoc = {
  tags: ["donor"],
  summary: "View donor",
  description: "Fetch one donor information by id",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid()
      .describe("Identifier of the donor.")
      .meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  response: {
    200: z.object({
      message: z.string()
        .describe("Success message."),
      donor: z.object({
        id: z.string(),
        user_id: z.string().nullable(),
        name: z.string(),
        email: z.string(),
        document: z.string().nullable(),
        document_type: z.string().nullable(),
        phone: z.string().nullable(),
        anonymized_at: z.iso.datetime().nullable(),
        created_at: z.iso.datetime(),
        updated_at: z.iso.datetime(),
      }),
    }).describe("Donor successfully fetched."),

    400: validationErrorSchema.describe("Bad Request: Validation failure or business rule violation."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized. Missing, invalid or expired JWT token."),

    403: z.object({
      error: z.string()
    }).describe("Forbidden: The authenticated user's role is not allowed to see the donor."),

    404: z.object({
      error: z.string(),
    }).describe("Donor not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  }
}