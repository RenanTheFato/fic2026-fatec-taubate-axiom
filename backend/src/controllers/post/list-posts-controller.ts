import { Request, Response } from "express";
import { z } from "zod/v4";
import { POST_CATEGORIES } from "../../models/post-model.js";
import { ListPostsService } from "../../services/post/list-posts-service.js";

export class ListPostsController {
  async handle(req: Request, res: Response) {
    const postQuery = z.object({
      category: z.enum(POST_CATEGORIES, { error: "The category must be educacao, inclusao, saude or eventos" })
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
        .default(12),
    })

    const parsedPostQuery = postQuery.safeParse(req.query)

    if (!parsedPostQuery.success) {
      const errors = parsedPostQuery.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { category, page, limit } = parsedPostQuery.data

    try {
      const listPostsService = new ListPostsService()
      const { posts, total } = await listPostsService.execute({ category, page, limit })

      return res.status(200).json({ message: "Posts Fetched Successfully", posts, total })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
