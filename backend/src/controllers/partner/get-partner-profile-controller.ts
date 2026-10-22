import { Request, Response } from "express";
import { NotFoundError } from "../../config/errors.js";
import { UserInterface } from "../../interfaces/user-interface.js";
import { GetPartnerProfileService } from "../../services/partner/get-partner-profile-service.js";

export class GetPartnerProfileController {
  async handle(req: Request, res: Response) {
    const { id } = req.user as Pick<UserInterface, 'id'>

    try {
      const getPartnerProfileService = new GetPartnerProfileService()
      const partner = await getPartnerProfileService.execute({ user_id: id })

      return res.status(200).json({ message: "Partner Fetched Successfully", partner })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
