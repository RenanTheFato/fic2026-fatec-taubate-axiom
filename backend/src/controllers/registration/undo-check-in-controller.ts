import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { UndoCheckInService } from "../../services/registration/undo-check-in-service.js";

export class UndoCheckInController {
  async handle(req: Request, res: Response) {
    const registrationParams = z.object({
      id: z.uuid({ error: "The id must be a valid uuid" }),
    })

    const parsedParams = registrationParams.safeParse(req.params)

    if (!parsedParams.success) {
      const errors = parsedParams.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { id } = parsedParams.data

    try {
      const undoCheckInService = new UndoCheckInService()
      const registration = await undoCheckInService.execute({ id })

      return res.status(200).json({ message: "Check-in Undone Successfully", registration })
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
