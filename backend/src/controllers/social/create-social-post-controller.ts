import { Request, Response } from "express";
import { z } from "zod/v4";
import { SOCIAL_NETWORKS } from "../../models/social-post-model.js";
import { CreateSocialPostService } from "../../services/social/create-social-post-service.js";
import { isImageUrl } from "../../utils/image-url.js";
import { isNetworkUrl, youtubeVideoId } from "../../utils/social-url.js";

export class CreateSocialPostController {
  async handle(req: Request, res: Response) {
    const socialValidate = z.object({
      network: z.enum(SOCIAL_NETWORKS, { error: "The network must be instagram, facebook or youtube" }),
      url: z.string({ error: "The address must be a string" })
        .trim()
        .max(500, { error: "The address has exceeded the character limit (500)." }),
      // O limite de legenda do Instagram, que é a rede de texto mais longo das três.
      caption: z.string({ error: "The caption must be a string" })
        .trim()
        .min(3, { error: "The caption doesn't meet the minimum number of characters (3)." })
        .max(2200, { error: "The caption has exceeded the character limit (2200)." }),
      image_url: z.string({ error: "The image url must be a string" })
        .trim()
        .max(500, { error: "The image url has exceeded the character limit (500)." })
        .refine(isImageUrl, { error: "The image url must be a site path, an https address or a photo uploaded to this API" })
        .nullish()
        .default(null),
      published_at: z.coerce.date({ error: "The publication date isn't a valid date." })
        .refine((date) => date.getTime() <= Date.now(), { error: "The publication date can't be in the future." }),
    }).superRefine((post, ctx) => {
      if (!isNetworkUrl(post.network, post.url)) {
        ctx.addIssue({ code: "custom", path: ["url"], message: "The address doesn't belong to the chosen network." })
      }

      if (post.network === "youtube" && !youtubeVideoId(post.url)) {
        ctx.addIssue({ code: "custom", path: ["url"], message: "The address must point to a YouTube video." })
      }

      // Foto e texto são o que o site mostra; o vídeo do YouTube já traz a própria capa.
      if (post.network !== "youtube" && !post.image_url) {
        ctx.addIssue({ code: "custom", path: ["image_url"], message: "An Instagram or Facebook post needs its image." })
      }
    })

    const parsedSocial = socialValidate.safeParse(req.body)

    if (!parsedSocial.success) {
      const errors = parsedSocial.error.issues.map((err) => ({
        code: err.code,
        message: err.message,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { network, url, caption, image_url, published_at } = parsedSocial.data

    try {
      const createSocialPostService = new CreateSocialPostService()
      const post = await createSocialPostService.execute({ network, url, caption, image_url, published_at, created_by: req.user?.id ?? null })

      return res.status(201).json({ message: "Social Post Created Successfully", post })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
