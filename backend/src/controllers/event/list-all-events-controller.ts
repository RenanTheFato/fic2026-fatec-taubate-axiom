import { Request, Response } from "express";
import { z } from "zod/v4";
import { ListAllEventsService } from "../../services/event/list-all-events-service.js";

export class ListAllEventsController {
  async handle(req: Request, res: Response) {

    const eventsQuery = z.object({
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

    const parsedEventsQuery = eventsQuery.safeParse(req.query)

    if (!parsedEventsQuery.success) {
      const errors = parsedEventsQuery.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { page, limit } = parsedEventsQuery.data

    try {
      const listAllEventsService = new ListAllEventsService()
      const { events, total } = await listAllEventsService.execute({ page, limit })

      return res.status(200).json({ message: "All Events Fetched Successfully", events, total })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}