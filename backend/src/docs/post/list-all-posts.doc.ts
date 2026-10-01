import { z } from "zod/v4";

const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

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

export const listAllPostsDoc = {
  tags: ["post"],
  summary: "List every post, in any status",
  description: "Drafts, published and archived posts with their author, for the communication panel.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  query: z.object({
    page: z.coerce.number().optional().describe("Page number, starting at 1.").meta({ example: 1 }),
    limit: z.coerce.number().optional().describe("Posts per page, at most 50.").meta({ example: 50 }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      posts: z.array(postSchema.extend({
        author: z.object({ id: z.string(), name: z.string() }).nullable(),
      })),
      total: z.number(),
    }).describe("Posts fetched."),

    400: validationErrorSchema.describe("Bad Request: invalid query."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to list every post."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
