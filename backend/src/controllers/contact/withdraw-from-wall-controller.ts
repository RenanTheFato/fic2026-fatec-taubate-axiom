import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { WithdrawFromWallService } from "../../services/contact/withdraw-from-wall-service.js";

export class WithdrawFromWallController {
  async handle(req: Request, res: Response) {
    const contactParams = z.object({
      id: z.uuid({ error: "The id must be a valid uuid" }),
    })

    const parsedContactParams = contactParams.safeParse(req.params)

    if (!parsedContactParams.success) {
      const errors = parsedContactParams.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { id } = parsedContactParams.data

    try {
      const withdrawFromWallService = new WithdrawFromWallService()
      const { contact, withdrawn } = await withdrawFromWallService.execute({ id, role: req.user?.role, resolved_by: req.user?.id ?? null })

      return res.status(200).json({ message: "Name Withdrawn From The Wall", contact, withdrawn })
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
