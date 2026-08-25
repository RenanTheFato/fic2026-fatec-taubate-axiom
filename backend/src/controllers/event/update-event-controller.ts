import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { UpdateEventService } from "../../services/event/update-event-service.js";
import { hasAtMostTwoDecimals } from "../../utils/money.js";

export class UpdateEventController {
  async handle(req: Request, res: Response) {
    const { id: event_id } = req.params as { id: string }

    const eventValidate = z.object({
      campaign_id: z.uuid({ error: "The campaign id isn't a valid uuid." })
        .nullish(),
      title: z.string()
        .min(2, { error: "The title doesn't meet the minimum number of characters (2)." })
        .max(128, { error: "The title has exceeded the character limit (128)." })
        .optional(),
      description: z.string()
        .max(2048, { error: "The description has exceeded the character limit (2048)." })
        .nullish(),
      location: z.string()
        .max(255, { error: "The location has exceeded the character limit (255)." })
        .nullish(),
      starts_at: z.coerce.date({ error: "The start date isn't a valid date." }).optional(),
      ends_at: z.coerce.date({ error: "The end date isn't a valid date." })
        .nullish(),
      ticket_price: z.number({ error: "The ticket price must be a number." })
        .nonnegative({ error: "The ticket price can't be negative." })
        .multipleOf(0.01, { error: "The ticket price must have at most two decimal places." })
        .max(99999999.99, { error: "The ticket price has exceeded the allowed limit (99999999.99)." })
        .refine(hasAtMostTwoDecimals, { error: "The ticket price must have at most two decimal places." })
        .transform((ticket_price) => ticket_price.toFixed(2))
        .optional(),
    }).refine((event) => Object.keys(event).length > 0, {
      error: "At least one field must be provided to update the event.",
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

    const { campaign_id, title, description, location, starts_at, ends_at, ticket_price } = parsedEvent.data

    try {
      const updateEventService = new UpdateEventService()
      const event = await updateEventService.execute({ event_id, campaign_id, title, description, location, starts_at, ends_at, ticket_price })

      return res.status(200).json({ message: "Event Updated Successfully", event })
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
