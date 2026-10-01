import { z } from "zod/v4";

export const deletePostDoc = {
  tags: ["post"],
  summary: "Delete a draft post",
  description: "Only a draft that was never public can be deleted. Anything that was on the site leaves by archiving. Restricted to admin.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  params: z.object({
    id: z.uuid()
      .describe("Identifier of the post.")
      .meta({ example: "0b7f5a12-9c4e-4f8a-9d2b-6a1f3e5c7d90" }),
  }),
  response: {
    200: z.object({
      message: z.string(),
    }).describe("Post deleted."),

    400: z.object({
      error: z.string(),
    }).describe("Bad Request: the post is not a draft."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to delete posts."),

    404: z.object({
      error: z.string(),
    }).describe("Post not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
