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

export const createPostDoc = {
  tags: ["post"],
  summary: "Create a news post",
  description: "Writes a post as a draft, with the slug generated from the title and the author taken from the token. Publishing is a separate action. Restricted to admin and communication.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  body: z.object({
    title: z.string()
      .describe("Public title of the post. The slug is generated from it once and never changes.")
      .meta({ example: "Chefs do Bem bate recorde de convites" }),
    excerpt: z.string()
      .describe("One or two sentences shown on cards and in the listing.")
      .meta({ example: "A sexta edição esgotou as três noites uma semana antes do evento." }),
    body: z.string()
      .describe("Plain text. A blank line separates paragraphs; HTML is never interpreted.")
      .meta({ example: "Primeiro parágrafo.\n\nSegundo parágrafo." }),
    category: z.enum(["educacao", "inclusao", "saude", "eventos"])
      .describe("Subject of the post, used by the filter tabs."),
    image_url: z.string()
      .nullish()
      .describe("Site path (/imagens/noticias/...) or https address of the cover photo.")
      .meta({ example: "/imagens/noticias/chefs-do-bem.png" }),
  }),
  response: {
    201: z.object({
      message: z.string(),
      post: postSchema,
    }).describe("Post created as a draft."),

    400: z.union([validationErrorSchema, z.object({
      error: z.string(),
    })])
      .describe("Bad Request: validation failure or a post with the same title already exists."),

    401: z.object({
      error: z.string(),
    }).describe("Unauthorized: Missing, invalid or expired bearer token."),

    403: z.object({
      error: z.string(),
    }).describe("Forbidden: The authenticated user's role is not allowed to create posts."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
