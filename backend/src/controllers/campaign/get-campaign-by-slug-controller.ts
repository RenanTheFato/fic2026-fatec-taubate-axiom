import { Request, Response } from "express";
import { z } from "zod/v4";
import { GetCampaignBySlugService } from "../../services/campaign/get-campaign-by-slug-service.js";
import { NotFoundError } from "../../config/errors.js";

export class GetCampaignBySlugController {
  async handle(req: Request, res: Response) {
    const getCampaignSlugParam = z.object({
      slug: z.string({ error: "The slug must be an string" })
    })

    const parsedGetCampaignSlugParam = getCampaignSlugParam.safeParse(req.params)

    if (!parsedGetCampaignSlugParam.success) {
      const errors = parsedGetCampaignSlugParam.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { slug } = parsedGetCampaignSlugParam.data

    try {
      const getCampaignBySlugService = new GetCampaignBySlugService()
      const campaign = await getCampaignBySlugService.execute({ slug })

      return res.status(200).json({ message: "Campaign Founded", campaign })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message})
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}