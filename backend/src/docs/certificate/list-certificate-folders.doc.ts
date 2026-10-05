import { z } from "zod/v4";
import { certificateDesignShape } from "./certificate-design-shape.doc.js";

export const listCertificateFoldersDoc = {
  tags: ["certificate"],
  summary: "List the certificate folders",
  description: "The default folder plus one folder per campaign and per event, whether customized or not, each with its number of versions, the current version and how many receipts were issued with any of them. Also returns the factory design, the one a receipt takes when no folder was ever customized.",
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
        versions: z.number(),
        issued: z.number(),
        current: z.object({
          id: z.string(),
          version: z.number(),
          label: z.string(),
          created_at: z.iso.datetime(),
        }).nullable(),
      })),
      factory: certificateDesignShape.describe("The factory design, starting point of a folder with no version."),
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
