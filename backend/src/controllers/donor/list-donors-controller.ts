import { Request, Response } from "express";
import { z } from "zod/v4";
import { ListDonorsService } from "../../services/donor/list-donors-service.js";

export class ListDonorsController {
  async handle(req: Request, res: Response) {
    const donorsQuery = z.object({
      page: z.coerce.number({ error: "The page must be an number" })
        .int({ error: "The page must be an integer" })
        .positive({ error: "The page number must be greater than zero" })
        .optional()
        .default(1),
      limit: z.coerce.number({ error: "The limit must be an number" })
        .int({ error: "The limit must be an integer" })
        .positive({ error: "The limit must be greater than zero" })
        .max(50, { error: "The limit has exceeded the maximum allowed limit (50)" })
        .optional()
        .default(50),
    })

    const parsedDonorsQuery = donorsQuery.safeParse(req.query)

    if (!parsedDonorsQuery.success) {
      const errors = parsedDonorsQuery.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { page, limit } = parsedDonorsQuery.data

    try {
      const listDonorsService = new ListDonorsService()
      const { donors, total } = await listDonorsService.execute({ page, limit })

      return res.status(200).json({ message: "All Donors Fetched Successfully", donors, total })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}