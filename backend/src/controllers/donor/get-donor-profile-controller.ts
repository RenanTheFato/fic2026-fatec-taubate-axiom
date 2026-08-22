import { Request, Response } from "express";
import { UserInterface } from "../../interfaces/user-interface.js";
import { NotFoundError } from "../../config/errors.js";
import { GetDonorProfileService } from "../../services/donor/get-donor-profile-service.js";

export class GetDonorProfileController {
  async handle(req: Request, res: Response) {
    const { id } = req.user as Pick<UserInterface, 'id'>

    try {
      const getDonorProfileService = new GetDonorProfileService()
      const donor = await getDonorProfileService.execute({ user_id: id })

      return res.status(200).json({ message: "Fetched Successfully", donor })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).send({ error: "Internal Server Error" })
    }
  }
}