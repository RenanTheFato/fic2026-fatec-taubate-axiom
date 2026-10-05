import { z } from "zod/v4";

const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

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

export const uploadCertificateAssetDoc = {
  tags: ["certificate"],
  summary: "Upload an image to the certificate library",
  description: "The request body is the raw file with Content-Type image/png or image/jpeg, never JSON or base64. The type is read from the bytes, not from the header. At most 3 MB and 4000 pixels on each side.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  bodyContentType: "image/png",
  body: z.string().meta({ format: "binary" }).describe("The image file itself. image/jpeg is accepted too."),
  query: z.object({
    name: z.string().describe("Name shown in the library.").meta({ example: "Estrela dourada" }),
  }),
  response: {
    201: z.object({
      message: z.string(),
      asset: assetSchema,
    }).describe("Image stored."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: not a PNG or JPEG, too big, or missing name."),

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
