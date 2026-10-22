import { z } from "zod/v4";
import { socialNetworks, socialPostSchema, validationErrorSchema } from "./social-shape.doc.js";

export const listAllSocialPostsDoc = {
  tags: ["social"],
  summary: "List every social media post, hidden included",
  description: "Admin and communication. instagram_import tells whether INSTAGRAM_ACCESS_TOKEN is set, so the panel only offers the import when it works.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  query: z.object({
    network: socialNetworks.optional(),
    page: z.coerce.number().optional().describe("Page number, starting at 1.").meta({ example: 1 }),
    limit: z.coerce.number().optional().describe("Posts per page, at most 50. Defaults to 20.").meta({ example: 20 }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      posts: z.array(socialPostSchema.extend({ author: z.object({ id: z.string(), name: z.string() }).nullable() })),
      total: z.number(),
      instagram_import: z.boolean(),
    }).describe("Posts fetched."),

    400: validationErrorSchema.describe("Bad Request: invalid query."),

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
