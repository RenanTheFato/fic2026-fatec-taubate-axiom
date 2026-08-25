import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError } from "../../config/errors.js";
import { CreateCampaignService } from "../../services/campaign/create-campaign-service.js";
import { hasAtMostTwoDecimals } from "../../utils/money.js";

export class CreateCampaignController {
  async handle(req: Request, res: Response) {
    const campaignValidate = z.object({
      title: z.string()
        .min(2, { error: "The title doesn't meet the minimum number of characters (2)." })
        .max(128, { error: "The title has exceeded the character limit (128)." }),
      description: z.string()
        .max(2048, { error: "The description has exceeded the character limit (2048)." })
        .nullish()
        .default(null),
      goal_amount: z.number({ error: "The goal amount must be a number." })
        .positive({ error: "The goal amount must be greater than zero." })
        .multipleOf(0.01, { error: "The goal amount must have at most two decimal places." })
        .max(9999999999.99, { error: "The goal amount has exceeded the allowed limit (9999999999.99)." })
        .refine(hasAtMostTwoDecimals, { error: "The goal amount must have at most two decimal places." })
        .transform((goal_amount) => goal_amount.toFixed(2)),
      starts_at: z.coerce.date({ error: "The start date isn't a valid date." }),
      ends_at: z.coerce.date({ error: "The end date isn't a valid date." })
        .nullish()
        .default(null),
    }).refine((campaign) => !campaign.ends_at || campaign.ends_at > campaign.starts_at, {
      error: "The end date must be after the start date.",
      path: ["ends_at"],
    })

    const parsedCampaign = campaignValidate.safeParse(req.body)

    if (!parsedCampaign.success) {
      const errors = parsedCampaign.error.issues.map((err) => ({
        code: err.code,
        message: err.message,
        path: err.path.join("/")
      }))

      return res.status(400).json({ message: "Validation Error Occurred", errors })
    }

    const { title, description, goal_amount, starts_at, ends_at } = parsedCampaign.data

    try {
      const createCampaignService = new CreateCampaignService()
      const campaign = await createCampaignService.execute({ title, description, goal_amount, starts_at, ends_at })
      return res.status(201).json({ message: "Campaign Created Successfully", campaign })
    } catch (error: unknown) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).send({ error: "Internal Server Error" })
    }
  }
}
