import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError } from "../../config/errors.js";
import { CreateEventService } from "../../services/event/create-event-service.js";

export class CreateEventController {
  async handle(req: Request, res: Response) {
    const eventValidate = z.object({
      campaign_id: z.uuid({ error: "The campaign id isn't a valid uuid." })
        .nullish()
        .default(null),
      title: z.string()
        .min(2, { error: "The title doesn't meet the minimum number of characters (2)." })
        .max(128, { error: "The title has exceeded the character limit (128)." }),
      description: z.string()
        .max(2048, { error: "The description has exceeded the character limit (2048)." })
        .nullish()
        .default(null),
      location: z.string()
        .max(255, { error: "The location has exceeded the character limit (255)." })
        .nullish()
        .default(null),
      starts_at: z.coerce.date({ error: "The start date isn't a valid date." }),
      ends_at: z.coerce.date({ error: "The end date isn't a valid date." })
        .nullish()
        .default(null),
      ticket_price: z.number({ error: "The ticket price must be a number." })
        .nonnegative({ error: "The ticket price can't be negative." })
        .multipleOf(0.01, { error: "The ticket price must have at most two decimal places." })
        .max(99999999.99, { error: "The ticket price has exceeded the allowed limit (99999999.99)." })
        .optional()
        .default(0)
        .transform((ticket_price) => ticket_price.toFixed(2)),
      capacity: z.number({ error: "The capacity must be a number." })
        .int({ error: "The capacity must be an integer." })
        .positive({ error: "The capacity must be greater than zero." })
        .max(4294967295, { error: "The capacity has exceeded the allowed limit (4294967295)." })
        .nullish()
        .default(null),
    }).refine((event) => !event.ends_at || event.ends_at > event.starts_at, {
      error: "The end date must be after the start date.",
      path: ["ends_at"],
    })

    const parsedEvent = eventValidate.safeParse(req.body)

    if (!parsedEvent.success) {
      const errors = parsedEvent.error.issues.map((err) => ({
        code: err.code,
        message: err.message,
        path: err.path.join("/")
      }))

      return res.status(400).json({ message: "Validation Error Occurred", errors })
    }

    const { campaign_id, title, description, location, starts_at, ends_at, ticket_price, capacity } = parsedEvent.data

    try {
      const createEventService = new CreateEventService()
      const event = await createEventService.execute({ campaign_id, title, description, location, starts_at, ends_at, ticket_price, capacity })
      return res.status(201).json({ message: "Event Created Successfully", event })
    } catch (error: unknown) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).send({ error: "Internal Server Error" })
    }
  }
}
