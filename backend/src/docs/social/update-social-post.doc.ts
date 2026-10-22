import { z } from "zod/v4";
import { socialBodySchema, socialPostSchema, validationErrorSchema } from "./social-shape.doc.js";

export const updateSocialPostDoc = {
  tags: ["social"],
  summary: "Edit a social media post",
  description: "Admin and communication. Same rules as the creation.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid().describe("Identifier of the post.").meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  body: socialBodySchema,
  response: {
    200: z.object({
      message: z.string(),
      post: socialPostSchema,
    }).describe("Post updated."),

    400: validationErrorSchema.describe("Bad Request: invalid fields, an address of another network, or a post without its image."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to manage the social media page."),

    404: z.object({
      error: z.string(),
    }).describe("Post not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
