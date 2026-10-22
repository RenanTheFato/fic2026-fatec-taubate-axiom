import { Request, Response } from "express";
import { z } from "zod/v4";
import { NotFoundError } from "../../config/errors.js";
import { SetSocialPostVisibilityService } from "../../services/social/set-social-post-visibility-service.js";

export class SetSocialPostVisibilityController {
  async handle(req: Request, res: Response) {
    const socialParams = z.object({
      id: z.uuid({ error: "The id must be a valid uuid" }),
    })

    const visibilityValidate = z.object({
      visible: z.boolean({ error: "The visible flag must be a boolean" }),
    })

    const parsedParams = socialParams.safeParse(req.params)
    const parsedVisibility = visibilityValidate.safeParse(req.body)

    if (!parsedParams.success || !parsedVisibility.success) {
      const issues = [...(parsedParams.error?.issues ?? []), ...(parsedVisibility.error?.issues ?? [])]
      const errors = issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { id } = parsedParams.data
    const { visible } = parsedVisibility.data

    try {
      const setSocialPostVisibilityService = new SetSocialPostVisibilityService()
      const post = await setSocialPostVisibilityService.execute({ id, visible })

      return res.status(200).json({ message: visible ? "Social Post Is Now Visible" : "Social Post Is Now Hidden", post })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
