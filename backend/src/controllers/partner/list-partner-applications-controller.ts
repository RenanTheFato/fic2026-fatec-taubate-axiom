import { Request, Response } from "express";
import { z } from "zod/v4";
import { PARTNER_STATUSES } from "../../models/partner-model.js";
import { ListPartnerApplicationsService } from "../../services/partner/list-partner-applications-service.js";

export class ListPartnerApplicationsController {
  async handle(req: Request, res: Response) {
    const applicationsQuery = z.object({
      status: z.enum(PARTNER_STATUSES, { error: "The status must be pending, approved or refused" })
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
        .max(50, { error: "The limit has exceeded the maximum allowed limit (50)" })
        .optional()
        .default(20),
    })

    const parsedApplicationsQuery = applicationsQuery.safeParse(req.query)

    if (!parsedApplicationsQuery.success) {
      const errors = parsedApplicationsQuery.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { status, page, limit } = parsedApplicationsQuery.data

    try {
      const listPartnerApplicationsService = new ListPartnerApplicationsService()
      const { partners, total, pending } = await listPartnerApplicationsService.execute({ status, page, limit })

      return res.status(200).json({ message: "Partnership Requests Fetched Successfully", partners, total, pending })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
