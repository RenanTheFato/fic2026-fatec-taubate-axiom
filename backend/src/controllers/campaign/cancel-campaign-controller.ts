import { Request, Response } from "express";
import { UserInterface } from "../../interfaces/user-interface.js";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { CancelCampaignService } from "../../services/campaign/cancel-campaign-service.js";

export class CancelCampaignController {
  async handle(req: Request, res: Response) {
    const { id } = req.user as Pick<UserInterface, 'id'>

    if (!id) {
      return res.status(400).json({ error: "The id is missing" })
    }

    const { campaign_id } = req.params as { campaign_id: string }

    try {
      const cancelCampaignService = new CancelCampaignService()
      await cancelCampaignService.execute({ campaign_id })

      return res.status(200).json({ message: "Campaign is now cancelled" })
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