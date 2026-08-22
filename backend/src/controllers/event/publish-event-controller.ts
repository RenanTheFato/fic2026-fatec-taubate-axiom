import { Request, Response } from "express";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { PublishEventService } from "../../services/event/publish-event-service.js";

export class PublishEventController {
  async handle(req: Request, res: Response) {
    const { id: event_id } = req.params as { id: string }

    try {
      const publishEventService = new PublishEventService()
      await publishEventService.execute({ event_id })

      return res.status(200).json({ message: "Event is now published" })
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
