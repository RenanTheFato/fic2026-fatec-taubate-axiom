import { Request, Response } from "express";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { DeletePostService } from "../../services/post/delete-post-service.js";

export class DeletePostController {
  async handle(req: Request, res: Response) {
    const { id: post_id } = req.params as { id: string }

    try {
      const deletePostService = new DeletePostService()
      await deletePostService.execute({ post_id })

      return res.status(200).json({ message: "Post Deleted Successfully" })
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
