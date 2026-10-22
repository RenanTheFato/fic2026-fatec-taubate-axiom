import { Request, Response } from "express";
import { z } from "zod/v4";
import { VOLUNTEER_STATUSES } from "../../models/volunteer-model.js";
import { ListVolunteersService } from "../../services/volunteer/list-volunteers-service.js";

export class ListVolunteersController {
  async handle(req: Request, res: Response) {
    const volunteersQuery = z.object({
      status: z.enum(VOLUNTEER_STATUSES, { error: "The status must be pending, approved or refused" })
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

    const parsedVolunteersQuery = volunteersQuery.safeParse(req.query)

    if (!parsedVolunteersQuery.success) {
      const errors = parsedVolunteersQuery.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { status, page, limit } = parsedVolunteersQuery.data

    try {
      const listVolunteersService = new ListVolunteersService()
      const { volunteers, total, pending } = await listVolunteersService.execute({ status, page, limit })

      return res.status(200).json({ message: "Volunteers Fetched Successfully", volunteers, total, pending })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
