import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { UpdateCampaignService } from "../../services/campaign/update-campaign-service.js";
import { hasAtMostTwoDecimals } from "../../utils/money.js";

export class UpdateCampaignController {
  async handle(req: Request, res: Response) {
    const { id: campaign_id } = req.params as { id: string }

    const campaignValidate = z.object({
      title: z.string()
        .min(2, { error: "The title doesn't meet the minimum number of characters (2)." })
        .max(128, { error: "The title has exceeded the character limit (128)." })
        .optional(),
      description: z.string()
        .max(2048, { error: "The description has exceeded the character limit (2048)." })
        .nullish(),
      goal_amount: z.number({ error: "The goal amount must be a number." })
        .positive({ error: "The goal amount must be greater than zero." })
        .multipleOf(0.01, { error: "The goal amount must have at most two decimal places." })
        .max(9999999999.99, { error: "The goal amount has exceeded the allowed limit (9999999999.99)." })
        .refine(hasAtMostTwoDecimals, { error: "The goal amount must have at most two decimal places." })
        .transform((goal_amount) => goal_amount.toFixed(2))
        .optional(),
      starts_at: z.coerce.date({ error: "The start date isn't a valid date." }).optional(),
      ends_at: z.coerce.date({ error: "The end date isn't a valid date." }).nullish(),
    }).refine((campaign) => Object.keys(campaign).length > 0, {
      error: "At least one field must be provided to update the campaign.",
    })

    const parsedCampaign = campaignValidate.safeParse(req.body)

    if (!parsedCampaign.success) {
      const errors = parsedCampaign.error.issues.map((err) => ({
        code: err.code,
        message: err.message,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { title, description, goal_amount, starts_at, ends_at } = parsedCampaign.data

    try {
      const updateCampaignService = new UpdateCampaignService()
      const campaign = await updateCampaignService.execute({
        campaign_id,
        title,
        description,
        goal_amount,
        starts_at,
        ends_at
      })

      return res.status(200).json({ message: "Campaign Updated Successfully", campaign })
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
