import { Request, Response } from "express";
import { ForbiddenError, NotFoundError } from "../../config/errors.js";
import { UserInterface } from "../../interfaces/user-interface.js";
import { ListOpenVolunteerShiftsService } from "../../services/volunteer-shift/list-open-volunteer-shifts-service.js";

export class ListOpenVolunteerShiftsController {
  async handle(req: Request, res: Response) {
    const { id } = req.user as Pick<UserInterface, 'id'>

    try {
      const listOpenVolunteerShiftsService = new ListOpenVolunteerShiftsService()
      const shifts = await listOpenVolunteerShiftsService.execute({ user_id: id })

      return res.status(200).json({ message: "Open Shifts Fetched Successfully", shifts })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      if (error instanceof ForbiddenError) {
        return res.status(403).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
