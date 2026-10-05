import { z } from "zod/v4";

const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const getCertificateAssetDoc = {
  tags: ["certificate"],
  summary: "Download one image of the library",
  description: "Public, immutable and cacheable for a year: the image is already printed on certificates that circulate, and the id is an unguessable UUID. The response body is the file, not JSON.",
  contentType: "image/png",
  params: z.object({
    id: z.uuid().describe("Identifier of the image.").meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  response: {
    200: z.string().meta({ format: "binary" }).describe("The image, as PNG or JPEG."),

    400: validationErrorSchema.describe("Bad Request: invalid id."),

    404: z.object({
      error: z.string(),
    }).describe("Image not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
