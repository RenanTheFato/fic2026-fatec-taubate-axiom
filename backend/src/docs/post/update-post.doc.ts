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

export const updatePostDoc = {
  tags: ["post"],
  summary: "Edit a post",
  description: "Partial update: an absent field is left untouched. The slug never changes, so a shared link keeps working.",
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
  body: z.object({
    title: z.string().optional()
      .describe("Public title of the post. The slug is generated from it once and never changes.")
      .meta({ example: "Chefs do Bem bate recorde de convites" }),
    excerpt: z.string().optional()
      .describe("One or two sentences shown on cards and in the listing.")
      .meta({ example: "A sexta edição esgotou as três noites uma semana antes do evento." }),
    body: z.string().optional()
      .describe("Plain text. A blank line separates paragraphs; HTML is never interpreted.")
      .meta({ example: "Primeiro parágrafo.\n\nSegundo parágrafo." }),
    category: z.enum(["educacao", "inclusao", "saude", "eventos"]).optional()
      .describe("Subject of the post, used by the filter tabs."),
    image_url: z.string()
      .nullish()
      .describe("Site path (/imagens/noticias/...) or https address of the cover photo.")
      .meta({ example: "/imagens/noticias/chefs-do-bem.png" }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      post: postSchema,
    }).describe("Post updated."),

    400: validationErrorSchema.describe("Bad Request: validation failure."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to edit posts."),

    404: z.object({
      error: z.string(),
    }).describe("Post not found."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
