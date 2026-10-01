import { Request, Response } from "express";
import { z } from "zod/v4";
import { ListAllPostsService } from "../../services/post/list-all-posts-service.js";

export class ListAllPostsController {
  async handle(req: Request, res: Response) {
    const postQuery = z.object({
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
        .default(50),
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

    const { page, limit } = parsedPostQuery.data

    try {
      const listAllPostsService = new ListAllPostsService()
      const { posts, total } = await listAllPostsService.execute({ page, limit })

      return res.status(200).json({ message: "All Posts Fetched Successfully", posts, total })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
