import { Request, Response } from "express";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { CancelEventService } from "../../services/event/cancel-event-service.js";

export class CancelEventController {
  async handle(req: Request, res: Response) {
    const { id: event_id } = req.params as { id: string }

    try {
      const cancelEventService = new CancelEventService()
      await cancelEventService.execute({ event_id })

      return res.status(200).json({ message: "Event is now cancelled" })
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
