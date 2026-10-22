import { z } from "zod/v4";
import { socialNetworks, socialPostSchema, validationErrorSchema } from "./social-shape.doc.js";

export const listSocialPostsDoc = {
  tags: ["social"],
  summary: "List the posts shown on the social media page",
  description: "Public. Visible posts only, newest first. Who registered them is not returned.",
  query: z.object({
    network: socialNetworks.optional(),
    page: z.coerce.number().optional().describe("Page number, starting at 1.").meta({ example: 1 }),
    limit: z.coerce.number().optional().describe("Posts per page, at most 24. Defaults to 12.").meta({ example: 12 }),
  }),
  response: {
    200: z.object({
      message: z.string(),
      posts: z.array(socialPostSchema.pick({ id: true, network: true, url: true, caption: true, image_url: true, video_id: true, published_at: true })),
      total: z.number(),
      networks: z.object({
        instagram: z.number(),
        facebook: z.number(),
        youtube: z.number(),
      }).describe("Visible posts per network, whatever the filter."),
    }).describe("Posts fetched."),

    400: validationErrorSchema.describe("Bad Request: invalid query."),

    500: z.object({
      error: z.string(),
    }).describe("Unexpected server error."),
  },
}
