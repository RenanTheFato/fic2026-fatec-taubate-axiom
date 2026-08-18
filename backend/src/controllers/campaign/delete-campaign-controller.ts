import { Request, Response } from "express";
import { UserInterface } from "../../interfaces/user-interface.js";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { DeleteCampaignService } from "../../services/campaign/delete-campaign-service.js";

export class DeleteCampaignController {
  async handle(req: Request, res: Response) {
    const { id } = req.user as Pick<UserInterface, 'id'>

    if (!id) {
      return res.status(400).json({ error: "The id is missing" })
    }

    const { campaign_id } = req.params as { campaign_id: string }

    try {
      const deleteCampaignService = new DeleteCampaignService()
      await deleteCampaignService.execute({ campaign_id })

      return res.status(204).json()
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