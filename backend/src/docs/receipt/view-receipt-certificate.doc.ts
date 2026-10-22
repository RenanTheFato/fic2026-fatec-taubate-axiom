import { z } from "zod/v4";
import { certificateDesignShape } from "../certificate/certificate-design-shape.doc.js";

const variantSchema = z.object({
  version: z.object({
    version: z.number(),
    label: z.string(),
  }).nullable().describe("The studio version the certificate was issued with. Null for the factory design."),
  design: certificateDesignShape,
  qr: z.string().describe("The verification QR code as a data:image/svg+xml URL, in the design's QR color."),
})

export const viewReceiptCertificateDoc = {
  tags: ["receipt"],
  summary: "Get an issued certificate to draw it on screen, without login",
  description: "Backs the site's certificate page, where someone who lost the PDF types the code and sees the certificate again. Returns both variants the receipt was issued with, the one that shows the amount and the one with a message in its place (each the studio version or the factory design, with its QR as an SVG data URL), the fields already written the way the PDF writes them and the chain verdict. The page lets the donor pick one variant or both. The donor document is never included. Like /receipt/verify, the 64-character hash is the credential.",
  params: z.object({
    hash: z.string()
      .describe("The SHA-256 hash printed on the certificate, in hexadecimal.")
      .meta({ example: "0d4f1a83c2be5e7d9106f3a48b25c7d0e91f6a3b8c47d25e0f1a9b3c6d8e2f40" }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      certificate: z.object({
        number: z.string(),
        status: z.enum(["issued", "cancelled"]),
        transaction_type: z.enum(["donation", "sponsorship", "ticket", "product"]),
        issued_at: z.iso.datetime(),
        cancelled_at: z.iso.datetime().nullable(),
        hash: z.string(),
        authentic: z.boolean().describe("The content and the chain link check out."),
        valid: z.boolean().describe("Authentic and not cancelled."),
        variants: z.object({
          amount: variantSchema.describe("The certificate that shows the amount."),
          message: variantSchema.describe("The certificate with a message in place of the amount."),
        }),
        fields: z.record(z.string(), z.string())
          .describe("Value of each {{field}} for this receipt.")
          .meta({ example: { nome: "Maria Aparecida Oliveira", valor: "R$ 150,00", numero: "2026/000123" } }),
      }),
    }).describe("Certificate found."),

    404: z.object({
      error: z.string(),
    }).describe("No receipt carries this hash."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
