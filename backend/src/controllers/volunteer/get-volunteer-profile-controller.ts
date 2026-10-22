import { Request, Response } from "express";
import { NotFoundError } from "../../config/errors.js";
import { UserInterface } from "../../interfaces/user-interface.js";
import { GetVolunteerProfileService } from "../../services/volunteer/get-volunteer-profile-service.js";

export class GetVolunteerProfileController {
  async handle(req: Request, res: Response) {
    const { id } = req.user as Pick<UserInterface, 'id'>

    try {
      const getVolunteerProfileService = new GetVolunteerProfileService()
      const volunteer = await getVolunteerProfileService.execute({ user_id: id })

      return res.status(200).json({ message: "Volunteer Fetched Successfully", volunteer })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
