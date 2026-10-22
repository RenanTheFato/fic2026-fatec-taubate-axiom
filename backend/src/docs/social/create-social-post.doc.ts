import { z } from "zod/v4";
import { socialBodySchema, socialPostSchema, validationErrorSchema } from "./social-shape.doc.js";

export const createSocialPostDoc = {
  tags: ["social"],
  summary: "Bring a social media post to the site",
  description: "Admin and communication. The post shows up on the social media page at once. A YouTube post keeps the video id, which the site plays inside the page, and takes the YouTube cover when no image is sent.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  body: socialBodySchema,
  response: {
    201: z.object({
      message: z.string(),
      post: socialPostSchema,
    }).describe("Post created."),

    400: validationErrorSchema.describe("Bad Request: invalid fields, an address of another network, or a post without its image."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to manage the social media page."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
