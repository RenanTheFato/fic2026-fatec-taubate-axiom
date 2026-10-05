import { z } from "zod/v4";
import { certificateDesignShape } from "./certificate-design-shape.doc.js";

const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const previewCertificateDoc = {
  tags: ["certificate"],
  summary: "Render an unsaved design as PDF",
  description: "The editor's preview: the real certificate template with sample data and a MODELO stamp across the page, so the file can't circulate as an issued certificate. Nothing is stored. The response body is the file, not JSON.",
  contentType: "application/pdf",
  security: [
    {
      bearerAuth: [],
    },
  ],
  body: z.object({
    scope: z.enum(["default", "campaign", "event"]),
    target_id: z.uuid().nullish(),
    transaction_type: z.enum(["donation", "sponsorship", "ticket", "product"]).optional()
      .describe("Which title and wording to preview. Defaults to donation."),
    design: certificateDesignShape,
  }),
  response: {
    200: z.string().meta({ format: "binary" }).describe("The preview PDF."),

    400: validationErrorSchema.describe("Bad Request: invalid design."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to manage certificates."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
