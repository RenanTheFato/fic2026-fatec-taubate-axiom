import { Request, Response } from "express";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { PublishPostService } from "../../services/post/publish-post-service.js";

export class PublishPostController {
  async handle(req: Request, res: Response) {
    const { id: post_id } = req.params as { id: string }

    try {
      const publishPostService = new PublishPostService()
      const post = await publishPostService.execute({ post_id })

      return res.status(200).json({ message: "Post Published Successfully", post })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
