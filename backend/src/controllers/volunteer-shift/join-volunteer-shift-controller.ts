import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../config/errors.js";
import { UserInterface } from "../../interfaces/user-interface.js";
import { JoinVolunteerShiftService } from "../../services/volunteer-shift/join-volunteer-shift-service.js";

export class JoinVolunteerShiftController {
  async handle(req: Request, res: Response) {
    const shiftParams = z.object({
      id: z.uuid({ error: "The id must be a valid uuid" }),
    })

    const parsedShiftParams = shiftParams.safeParse(req.params)

    if (!parsedShiftParams.success) {
      const errors = parsedShiftParams.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { id } = parsedShiftParams.data
    const { id: user_id } = req.user as Pick<UserInterface, 'id'>

    try {
      const joinVolunteerShiftService = new JoinVolunteerShiftService()
      const assignment = await joinVolunteerShiftService.execute({ shift_id: id, user_id })

      return res.status(201).json({ message: "Joined The Shift Successfully", assignment })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      if (error instanceof ForbiddenError) {
        return res.status(403).json({ error: error.message })
      }

      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
