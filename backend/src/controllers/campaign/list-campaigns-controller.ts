import { Request, Response } from "express";
import { z } from "zod/v4";
import { ListCampaignsService } from "../../services/campaign/list-campaigns-service.js";

export class ListCampaignsController {
  async handle(req: Request, res: Response) {

    const campaignParams = z.object({
      page: z.number({ error: "The page must be an number" })
        .positive({ error: "The page number must be greater than zero" })
        .optional()
        .default(1),
      limit: z.number({ error: "The limit must be an number" })
        .positive({ error: "The limit must be greater than zero" })
        .max(50, { error: "The limit has exceeded the maximum allowed limit (50)" })
        .optional()
        .default(50),
    })

    const parsedCampaignParams = campaignParams.safeParse(req.params)

    if (!parsedCampaignParams.success) {
      const errors = parsedCampaignParams.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { page, limit } = parsedCampaignParams.data

    try {
      const listCampaignsService = new ListCampaignsService()
      const campaigns = await listCampaignsService.execute({ page, limit })

      return res.status(200).json({ message: "All Campaigns Fetched Successfully", campaigns })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}