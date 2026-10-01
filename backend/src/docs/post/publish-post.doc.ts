import { z } from "zod/v4";

const postSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  body: z.string().describe("Plain text, one paragraph per block separated by a blank line."),
  category: z.enum(["educacao", "inclusao", "saude", "eventos"]),
  image_url: z.string().nullable(),
  status: z.enum(["draft", "published", "archived"]),
  published_at: z.iso.datetime().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export const publishPostDoc = {
  tags: ["post"],
  summary: "Publish a post",
  description: "Puts a draft or archived post on the site. Republishing keeps the original publication date, so an old story never jumps to the top as if it were new.",
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
      post: postSchema,
    }).describe("Status changed."),

    400: z.object({
      error: z.string(),
    }).describe("Bad Request: the current status doesn't allow this action."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to publish posts."),

    404: z.object({
      error: z.string(),
    }).describe("Post not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
