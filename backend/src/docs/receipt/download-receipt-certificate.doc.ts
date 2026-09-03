import { z } from "zod/v4";

export const downloadReceiptCertificateDoc = {
  tags: ["receipt"],
  summary: "Download the receipt as a coloured certificate",
  description: "The same receipt as /receipt/download, rendered as a landscape certificate meant to be kept and shared by the donor rather than filed by an accountant: institutional logo, coloured frame, the amount in evidence and the same verification QR code. It deliberately omits the donor document: this is the copy that circulates, and rule 3.6 keeps personal data off anything public. A refunded receipt is stamped CANCELADO across the page. Open, like the verification itself: the hash is the credential. The response body is the file, not JSON.",
  contentType: "application/pdf",
  params: z.object({
    hash: z.string()
      .describe("The SHA-256 hash printed on the receipt, in lowercase hexadecimal.")
      .meta({ example: "0d4f1a83c2be5e7d9106f3a48b25c7d0e91f6a3b8c47d25e0f1a9b3c6d8e2f40" }),
  }),
  response: {
    200: z.string()
      .meta({ format: "binary" })
      .describe("The certificate PDF."),

    404: z.object({
      error: z.string(),
    }).describe("No receipt carries this hash."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
