import { z } from "zod/v4";

const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const previewCertificateDesignDoc = {
  tags: ["certificate"],
  summary: "Render a saved version as PDF",
  description: "How a past version looked, with sample data and the MODELO stamp. The response body is the file, not JSON.",
  contentType: "application/pdf",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid().describe("Identifier of the version.").meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  query: z.object({
    transaction_type: z.enum(["donation", "sponsorship", "ticket", "product"]).optional(),
  }),
  response: {
    200: z.string().meta({ format: "binary" }).describe("The preview PDF."),

    400: validationErrorSchema.describe("Bad Request: invalid id."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to manage certificates."),

    404: z.object({
      error: z.string(),
    }).describe("Version not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
