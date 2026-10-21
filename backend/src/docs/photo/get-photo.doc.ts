import { z } from "zod/v4";

const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const getPhotoDoc = {
  tags: ["photo"],
  summary: "Download a cover photo",
  description: "Public, immutable and cacheable for a year: replacing a cover uploads a new photo with a new id, the old file is never rewritten. The response body is the file, not JSON.",
  contentType: "image/jpeg",
  params: z.object({
    id: z.uuid().describe("Identifier of the photo.").meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  response: {
    200: z.string().meta({ format: "binary" }).describe("The photo, as JPEG or PNG."),

    400: validationErrorSchema.describe("Bad Request: invalid id."),

    404: z.object({
      error: z.string(),
    }).describe("Photo not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
