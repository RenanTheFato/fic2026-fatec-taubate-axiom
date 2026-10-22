import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { UserInterface } from "../../interfaces/user-interface.js";
import { LeaveVolunteerShiftService } from "../../services/volunteer-shift/leave-volunteer-shift-service.js";

export class LeaveVolunteerShiftController {
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
      const leaveVolunteerShiftService = new LeaveVolunteerShiftService()
      const assignment = await leaveVolunteerShiftService.execute({ shift_id: id, user_id })

      return res.status(200).json({ message: "Left The Shift Successfully", assignment })
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
