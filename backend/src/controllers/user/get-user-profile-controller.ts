import { Request, Response } from "express";
import { UserInterface } from "../../interfaces/user-interface.js";
import { GetUserProfileService } from "../../services/user/get-user-profile-service.js";
import { NotFoundError } from "../../config/errors.js";

export class GetUserProfileController {
  async handle(req: Request, res: Response) {
    const { id } = req.user as Pick<UserInterface, 'id'>

    if (!id) {
      return res.status(400).json({ error: "The id is missing" })
    }

    try {
      const getUserProfileService = new GetUserProfileService()
      const user = await getUserProfileService.execute({ id })

      return res.status(200).json({ message: "Fetched Successfully", user })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).send({ error: "Internal Server Error" })
    }
  }
}