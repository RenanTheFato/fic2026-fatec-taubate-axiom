import { z } from "zod/v4";

export const downloadReceiptCertificateDoc = {
  tags: ["receipt"],
  summary: "Download the receipt as a coloured certificate",
  description: "The same receipt as /receipt/download, rendered as a landscape certificate meant to be kept and shared by the donor rather than filed by an accountant, with the studio design version the receipt was issued with. Its QR code leads to the site's certificate page (WEB_URL/certificado/{hash}). It deliberately omits the donor document: this is the copy that circulates, and rule 3.6 keeps personal data off anything public. The donor chooses the variant: the certificate that shows the amount, the one with a message in its place, or both in one file, one per page. A refunded receipt is stamped CANCELADO across the page. Open, like the verification itself: the hash is the credential. The response body is the file, not JSON.",
  contentType: "application/pdf",
  params: z.object({
    hash: z.string()
      .describe("The SHA-256 hash printed on the receipt, in lowercase hexadecimal.")
      .meta({ example: "0d4f1a83c2be5e7d9106f3a48b25c7d0e91f6a3b8c47d25e0f1a9b3c6d8e2f40" }),
  }),
  query: z.object({
    variant: z.enum(["amount", "message", "both"]).optional().describe("amount (default), message, or both on two pages."),
  }),
  response: {
    200: z.string()
      .meta({ format: "binary" })
      .describe("The certificate PDF."),

    400: z.object({
      error: z.string(),
      errors: z.array(z.object({ code: z.string(), message: z.string(), path: z.string() })),
    }).describe("Bad Request: unknown variant."),

    404: z.object({
      error: z.string(),
    }).describe("No receipt carries this hash."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
