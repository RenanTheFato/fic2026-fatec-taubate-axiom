import { z } from "zod/v4";

// O formato de uma publicação das redes sociais, compartilhado pelas rotas do domínio.

export const validationErrorSchema = z.object({
  error: z.string(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.string(),
  })),
}).describe("Input validation failed due to incorrect or missing data.")

export const socialNetworks = z.enum(["instagram", "facebook", "youtube"])

export const socialPostSchema = z.object({
  id: z.string(),
  network: socialNetworks,
  url: z.string().describe("The post on the network."),
  external_id: z.string().nullable().describe("The media id, on posts imported from Instagram."),
  caption: z.string(),
  image_url: z.string().nullable(),
  video_id: z.string().nullable().describe("The YouTube video the site plays inside the page."),
  published_at: z.iso.datetime(),
  visible: z.boolean(),
  created_by: z.string().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export const socialBodySchema = z.object({
  network: socialNetworks,
  url: z.string().describe("https address of the post on the chosen network. A YouTube address must point to a video.").meta({ example: "https://www.instagram.com/p/C9xYz12AbCd/" }),
  caption: z.string().describe("Between 3 and 2200 characters."),
  image_url: z.string().nullish().describe("Required on Instagram and Facebook: a site path, an https address or a photo uploaded to this API. YouTube takes the video cover."),
  published_at: z.iso.datetime().describe("When it was posted on the network; never in the future."),
})
