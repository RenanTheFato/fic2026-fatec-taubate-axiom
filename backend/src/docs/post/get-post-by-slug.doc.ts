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

export const getPostBySlugDoc = {
  tags: ["post"],
  summary: "Read one published post",
  description: "Public. A draft or archived post answers 404, exactly like one that never existed.",
  params: z.object({
    slug: z.string()
      .describe("Public slug of the post.")
      .meta({ example: "chefs-do-bem-bate-recorde-de-convites" }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      post: postSchema,
    }).describe("Post found."),

    400: validationErrorSchema.describe("Bad Request: invalid slug."),

    404: z.object({
      error: z.string(),
    }).describe("No published post has this slug."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
