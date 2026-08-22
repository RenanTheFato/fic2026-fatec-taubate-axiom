import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { UpdateEventCapacityService } from "../../services/event/update-event-capacity-service.js";

export class UpdateEventCapacityController {
  async handle(req: Request, res: Response) {
    const { id: event_id } = req.params as { id: string }

    const capacityValidate = z.object({
      capacity: z.number({ error: "The capacity must be a number." })
        .int({ error: "The capacity must be an integer." })
        .positive({ error: "The capacity must be greater than zero." })
        .max(4294967295, { error: "The capacity has exceeded the allowed limit (4294967295)." })
        .nullable(),
    })

    const parsedCapacity = capacityValidate.safeParse(req.body)

    if (!parsedCapacity.success) {
      const errors = parsedCapacity.error.issues.map((err) => ({
        code: err.code,
        message: err.message,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { capacity } = parsedCapacity.data

    try {
      const updateEventCapacityService = new UpdateEventCapacityService()
      const event = await updateEventCapacityService.execute({ event_id, capacity })

      return res.status(200).json({ message: "Event Capacity Updated", event })
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
