import { Request, Response } from "express";
import { z } from "zod/v4";
import { SOCIAL_NETWORKS } from "../../models/social-post-model.js";
import { ListSocialPostsService } from "../../services/social/list-social-posts-service.js";

export class ListSocialPostsController {
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
        .max(24, { error: "The limit has exceeded the maximum allowed limit (24)" })
        .optional()
        .default(12),
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
      const listSocialPostsService = new ListSocialPostsService()
      const { posts, total, networks } = await listSocialPostsService.execute({ network, page, limit })

      return res.status(200).json({ message: "Social Posts Fetched Successfully", posts, total, networks })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
