import { Request, Response } from "express";
import { z } from "zod/v4";
import { NotFoundError } from "../../config/errors.js";
import { DeleteSocialPostService } from "../../services/social/delete-social-post-service.js";

export class DeleteSocialPostController {
  async handle(req: Request, res: Response) {
    const socialParams = z.object({
      id: z.uuid({ error: "The id must be a valid uuid" }),
    })

    const parsedSocialParams = socialParams.safeParse(req.params)

    if (!parsedSocialParams.success) {
      const errors = parsedSocialParams.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { id } = parsedSocialParams.data

    try {
      const deleteSocialPostService = new DeleteSocialPostService()
      await deleteSocialPostService.execute({ id })

      return res.status(200).json({ message: "Social Post Deleted Successfully" })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
