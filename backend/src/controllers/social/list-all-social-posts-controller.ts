import { Request, Response } from "express";
import { z } from "zod/v4";
import { SOCIAL_NETWORKS } from "../../models/social-post-model.js";
import { ListAllSocialPostsService } from "../../services/social/list-all-social-posts-service.js";

export class ListAllSocialPostsController {
  async handle(req: Request, res: Response) {
    const socialQuery = z.object({
      network: z.enum(SOCIAL_NETWORKS, { error: "The network must be instagram, facebook or youtube" })
        .nullish()
        .default(null),
      page: z.coerce.number({ error: "The page must be an number" })
        .int({ error: "The page must be an integer" })
        .positive({ error: "The page number must be greater than zero" })
        .optional()
        .default(1),
      limit: z.coerce.number({ error: "The limit must be an number" })
        .int({ error: "The limit must be an integer" })
        .positive({ error: "The limit must be greater than zero" })
        .max(50, { error: "The limit has exceeded the maximum allowed limit (50)" })
        .optional()
        .default(20),
    })

    const parsedSocialQuery = socialQuery.safeParse(req.query)

    if (!parsedSocialQuery.success) {
      const errors = parsedSocialQuery.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { network, page, limit } = parsedSocialQuery.data

    try {
      const listAllSocialPostsService = new ListAllSocialPostsService()
      const { posts, total, instagram_import } = await listAllSocialPostsService.execute({ network, page, limit })

      return res.status(200).json({ message: "Social Posts Fetched Successfully", posts, total, instagram_import })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
