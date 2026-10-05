import { z } from "zod/v4";

const assetSchema = z.object({
  id: z.string(),
  name: z.string(),
  mime_type: z.enum(["image/png", "image/jpeg"]),
  width: z.number(),
  height: z.number(),
  size: z.number().describe("Bytes."),
  uploaded_by: z.string().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export const listCertificateAssetsDoc = {
  tags: ["certificate"],
  summary: "List the certificate image library",
  description: "Metadata of every background and decoration, newest first. The files themselves are served by /certificate/asset/:id.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  response: {
    200: z.object({
      message: z.string(),
      assets: z.array(assetSchema),
    }).describe("Library fetched."),

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
