import { z } from "zod/v4";

export const verifyReceiptDoc = {
  tags: ["receipt"],
  summary: "Verify the authenticity of a receipt, without login",
  description: "Open endpoint that proves a receipt was not tampered with. Every issued receipt carries the SHA-256 hash of the receipt before it, so the records form a chain: editing an old row changes its hash and breaks the link of every receipt issued after it. The endpoint runs two independent checks — it recomputes the hash over the stored content, and it compares the stored previous_hash against the hash of the receipt one position earlier. Both have to pass for the document to be authentic. The donor document comes back masked, because rule 3.6 keeps personal data off public endpoints. No token is required: the 64-character hash printed on the receipt is the credential, and it is what the QR code on the PDF points to.",
  params: z.object({
    hash: z.string()
      .describe("The SHA-256 hash printed on the receipt, in lowercase hexadecimal.")
      .meta({ example: "0d4f1a83c2be5e7d9106f3a48b25c7d0e91f6a3b8c47d25e0f1a9b3c6d8e2f40" }),
  }),
  response: {
    200: z.object({
      message: z.string().describe("Success message."),
      authentic: z.boolean()
        .describe("True when both the content and the chain link check out — the document is exactly what was issued."),
      valid: z.boolean()
        .describe("True when the receipt is authentic AND still issued. A refunded transaction leaves an authentic but cancelled receipt."),
      checks: z.object({
        content_matches: z.boolean()
          .describe("The hash recomputed over the stored fields equals the stored hash."),
        chain_matches: z.boolean()
          .describe("The stored previous_hash equals the hash of the receipt one position earlier — or the receipt is the first of the chain and carries no previous hash."),
      }),
      receipt: z.object({
        number: z.string().describe("Human readable number printed on the document."),
        sequence: z.number().describe("Position in the chain."),
        status: z.string().describe("issued or cancelled."),
        donor_name: z.string(),
        donor_document: z.string().nullable().describe("Masked. Enough to recognise your own document, not enough to reconstruct it."),
        amount: z.string(),
        transaction_type: z.string(),
        issued_at: z.iso.datetime(),
        cancelled_at: z.iso.datetime().nullable(),
        hash: z.string(),
        previous_hash: z.string().nullable().describe("Null only on the first receipt ever issued."),
      }),
    }).describe("Receipt verified successfully. Read authentic and valid — a 200 only means the hash was found."),

    404: z.object({
      error: z.string(),
    }).describe("No receipt carries this hash."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
