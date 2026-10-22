import { Request, Response } from "express";
import { z } from "zod/v4";
import { NotFoundError } from "../../config/errors.js";
import { SOCIAL_NETWORKS } from "../../models/social-post-model.js";
import { UpdateSocialPostService } from "../../services/social/update-social-post-service.js";
import { isImageUrl } from "../../utils/image-url.js";
import { isNetworkUrl, youtubeVideoId } from "../../utils/social-url.js";

export class UpdateSocialPostController {
  async handle(req: Request, res: Response) {
    const socialParams = z.object({
      id: z.uuid({ error: "The id must be a valid uuid" }),
    })

    const socialValidate = z.object({
      network: z.enum(SOCIAL_NETWORKS, { error: "The network must be instagram, facebook or youtube" }),
      url: z.string({ error: "The address must be a string" })
        .trim()
        .max(500, { error: "The address has exceeded the character limit (500)." }),
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

      if (post.network !== "youtube" && !post.image_url) {
        ctx.addIssue({ code: "custom", path: ["image_url"], message: "An Instagram or Facebook post needs its image." })
      }
    })

    const parsedParams = socialParams.safeParse(req.params)
    const parsedSocial = socialValidate.safeParse(req.body)

    if (!parsedParams.success || !parsedSocial.success) {
      const issues = [...(parsedParams.error?.issues ?? []), ...(parsedSocial.error?.issues ?? [])]
      const errors = issues.map((err) => ({
        code: err.code,
        message: err.message,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { id } = parsedParams.data
    const { network, url, caption, image_url, published_at } = parsedSocial.data

    try {
      const updateSocialPostService = new UpdateSocialPostService()
      const post = await updateSocialPostService.execute({ id, network, url, caption, image_url, published_at })

      return res.status(200).json({ message: "Social Post Updated Successfully", post })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
