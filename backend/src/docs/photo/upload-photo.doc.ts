import { z } from "zod/v4";

const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const uploadPhotoDoc = {
  tags: ["photo"],
  summary: "Upload a cover photo",
  description: "The cover photo of a campaign, event, product or post. The request body is the raw file with Content-Type image/png or image/jpeg, never JSON or base64; the type is read from the bytes. At most 5 MB and 6000 pixels on each side. The response carries the url that the catalogue stores in image_url.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  bodyContentType: "image/jpeg",
  body: z.string().meta({ format: "binary" }).describe("The image file itself. image/png is accepted too."),
  query: z.object({
    name: z.string().describe("Original file name, kept for reference.").meta({ example: "cantata-de-natal.jpg" }),
  }),
  response: {
    201: z.object({
      message: z.string(),
      photo: z.object({
        id: z.string(),
        name: z.string(),
        mime_type: z.enum(["image/png", "image/jpeg"]),
        width: z.number(),
        height: z.number(),
        size: z.number().describe("Bytes."),
        uploaded_by: z.string().nullable(),
        url: z.string().describe("Public address of the photo, ready for image_url."),
        created_at: z.iso.datetime(),
        updated_at: z.iso.datetime(),
      }),
    }).describe("Photo stored."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })]).describe("Bad Request: not a PNG or JPEG, too big, or missing name."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to upload photos."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
