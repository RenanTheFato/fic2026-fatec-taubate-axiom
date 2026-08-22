import { Request, Response } from "express";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { DeleteEventService } from "../../services/event/delete-event-service.js";

export class DeleteEventController {
  async handle(req: Request, res: Response) {
    const { event_id } = req.params as { event_id: string }

    try {
      const deleteEventService = new DeleteEventService()
      await deleteEventService.execute({ event_id })

      return res.status(204).json()
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
