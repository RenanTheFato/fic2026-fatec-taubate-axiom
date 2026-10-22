import { Request, Response } from "express";
import { NotFoundError } from "../../config/errors.js";
import { UserInterface } from "../../interfaces/user-interface.js";
import { ListMyVolunteerShiftsService } from "../../services/volunteer-shift/list-my-volunteer-shifts-service.js";

export class ListMyVolunteerShiftsController {
  async handle(req: Request, res: Response) {
    const { id } = req.user as Pick<UserInterface, 'id'>

    try {
      const listMyVolunteerShiftsService = new ListMyVolunteerShiftsService()
      const assignments = await listMyVolunteerShiftsService.execute({ user_id: id })

      return res.status(200).json({ message: "Shifts Fetched Successfully", assignments })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
