import { z } from "zod/v4";
import { validationErrorSchema } from "./social-shape.doc.js";

export const deleteSocialPostDoc = {
  tags: ["social"],
  summary: "Delete a social media post from the site",
  description: "Admin only. The post on the network stays there: this table is only the showcase.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid().describe("Identifier of the post.").meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  response: {
    200: z.object({
      message: z.string(),
    }).describe("Post deleted."),

    400: validationErrorSchema.describe("Bad Request: invalid id."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: only the administration deletes."),

    404: z.object({
      error: z.string(),
    }).describe("Post not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
