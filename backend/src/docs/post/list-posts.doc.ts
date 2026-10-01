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

export const listPostsDoc = {
  tags: ["post"],
  summary: "List the published posts",
  description: "Public. Only published posts, newest publication first, optionally filtered by category.",
  query: z.object({
    category: z.enum(["educacao", "inclusao", "saude", "eventos"]).optional()
      .describe("Only posts of this subject."),
    page: z.coerce.number().optional().describe("Page number, starting at 1.").meta({ example: 1 }),
    limit: z.coerce.number().optional().describe("Posts per page, at most 50. Defaults to 12.").meta({ example: 12 }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      posts: z.array(postSchema),
      total: z.number().describe("Published posts matching the filter, across all pages."),
    }).describe("Posts fetched."),

    400: validationErrorSchema.describe("Bad Request: invalid query."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
