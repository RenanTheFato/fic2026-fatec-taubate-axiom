import { z } from "zod/v4";
import { certificateDesignShape } from "./certificate-design-shape.doc.js";

const variantSummary = z.object({
  versions: z.number(),
  current: z.object({
    id: z.string(),
    version: z.number(),
    label: z.string(),
    created_at: z.iso.datetime(),
  }).nullable(),
})

export const listCertificateFoldersDoc = {
  tags: ["certificate"],
  summary: "List the certificate folders",
  description: "The default folder plus one folder per campaign and per event, whether customized or not. Each folder has two variants, the certificate that shows the amount and the one with a message in its place, each with its own number of versions and current version, plus how many receipts were issued with the folder. Also returns the factory design of each variant, the one a receipt takes when no folder was ever customized.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  response: {
    200: z.object({
      message: z.string(),
      folders: z.array(z.object({
        folder: z.string(),
        scope: z.enum(["default", "campaign", "event"]),
        target_id: z.string().nullable(),
        title: z.string(),
        status: z.string().nullable(),
        versions: z.number().describe("Versions of the two variants together."),
        issued: z.number(),
        variants: z.object({
          amount: variantSummary,
          message: variantSummary,
        }),
      })),
      factory: z.object({
        amount: certificateDesignShape,
        message: certificateDesignShape,
      }).describe("The factory design of each variant, starting point of a variant with no version."),
    }).describe("Folders fetched."),

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
