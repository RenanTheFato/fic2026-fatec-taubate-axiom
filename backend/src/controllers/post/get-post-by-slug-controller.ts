import { Request, Response } from "express";
import { z } from "zod/v4";
import { NotFoundError } from "../../config/errors.js";
import { GetPostBySlugService } from "../../services/post/get-post-by-slug-service.js";

export class GetPostBySlugController {
  async handle(req: Request, res: Response) {
    const postParams = z.object({
      slug: z.string({ error: "The slug must be a string" })
        .trim()
        .min(1, { error: "The slug is required" })
        .max(180, { error: "The slug has exceeded the maximum length (180)" }),
    })

    const parsedPostParams = postParams.safeParse(req.params)

    if (!parsedPostParams.success) {
      const errors = parsedPostParams.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { slug } = parsedPostParams.data

    try {
      const getPostBySlugService = new GetPostBySlugService()
      const post = await getPostBySlugService.execute({ slug })

      return res.status(200).json({ message: "Post Found", post })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
