import { Request, Response } from "express";
import { BadRequestError } from "../../config/errors.js";
import { ImportInstagramPostsService } from "../../services/social/import-instagram-posts-service.js";

export class ImportInstagramPostsController {
  async handle(req: Request, res: Response) {
    try {
      const importInstagramPostsService = new ImportInstagramPostsService()
      const result = await importInstagramPostsService.execute({ created_by: req.user?.id ?? null })

      return res.status(200).json({ message: "Instagram Posts Imported Successfully", ...result })
    } catch (error: unknown) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
