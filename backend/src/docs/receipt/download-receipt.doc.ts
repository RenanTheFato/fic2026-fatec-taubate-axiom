import { z } from "zod/v4";

export const downloadReceiptDoc = {
  tags: ["receipt"],
  summary: "Download the receipt as a PDF",
  description: "Renders the receipt as a PDF carrying the institutional header, the donor data as it stood at issuance, the amount, the chain hash of the document and a QR code pointing at the public verification endpoint. Open, like the verification itself: the hash is the credential. The response body is the file, not JSON — errors still answer in JSON, like the rest of the API.",
  contentType: "application/pdf",
  params: z.object({
    hash: z.string()
      .describe("The SHA-256 hash printed on the receipt, in lowercase hexadecimal.")
      .meta({ example: "0d4f1a83c2be5e7d9106f3a48b25c7d0e91f6a3b8c47d25e0f1a9b3c6d8e2f40" }),
  }),
  response: {
    200: z.string()
      .meta({ format: "binary" })
      .describe("The receipt PDF."),

    404: z.object({
      error: z.string(),
    }).describe("No receipt carries this hash."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
