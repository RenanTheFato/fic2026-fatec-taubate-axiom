import { Request, Response } from "express";
import { z } from "zod/v4";
import { NotFoundError } from "../../config/errors.js";
import { ListCampaignSupportersService } from "../../services/supporter/list-campaign-supporters-service.js";

export class ListCampaignSupportersController {
  async handle(req: Request, res: Response) {
    const supporterQuery = z.object({
      slug: z.string({ error: "The slug must be a string" })
        .trim()
        .min(1, { error: "The slug is required" })
        .max(180, { error: "The slug has exceeded the maximum length (180)" }),
      seed: z.string({ error: "The seed must be a string" })
        .regex(/^[a-zA-Z0-9]{1,32}$/, { error: "The seed must have up to 32 letters or numbers" })
        .nullish()
        .default(null),
      page: z.coerce.number({ error: "The page must be an number" })
        .int({ error: "The page must be an integer" })
        .positive({ error: "The page number must be greater than zero" })
        .optional()
        .default(1),
      limit: z.coerce.number({ error: "The limit must be an number" })
        .int({ error: "The limit must be an integer" })
        .positive({ error: "The limit must be greater than zero" })
        .max(300, { error: "The limit has exceeded the maximum allowed limit (300)" })
        .optional()
        .default(120),
    })

    const parsedSupporterQuery = supporterQuery.safeParse({ ...req.query, slug: req.params.slug })

    if (!parsedSupporterQuery.success) {
      const errors = parsedSupporterQuery.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { slug, seed, page, limit } = parsedSupporterQuery.data

    try {
      const listCampaignSupportersService = new ListCampaignSupportersService()
      const { supporters, total, contributors, seed: order } = await listCampaignSupportersService.execute({ slug, seed, page, limit })

      return res.status(200).json({ message: "Supporters Fetched Successfully", supporters, total, contributors, seed: order })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
