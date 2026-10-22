import { Request, Response } from "express";
import { NotFoundError } from "../../config/errors.js";
import { UserInterface } from "../../interfaces/user-interface.js";
import { ListMyPartnerProposalsService } from "../../services/partner-proposal/list-my-partner-proposals-service.js";

export class ListMyPartnerProposalsController {
  async handle(req: Request, res: Response) {
    const { id } = req.user as Pick<UserInterface, 'id'>

    try {
      const listMyPartnerProposalsService = new ListMyPartnerProposalsService()
      const proposals = await listMyPartnerProposalsService.execute({ user_id: id })

      return res.status(200).json({ message: "Proposals Fetched Successfully", proposals })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
