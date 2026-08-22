import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { EventInterface } from "../../interfaces/event-interface.js";
import { Event } from "../../models/event-model.js";

interface PublishEventProps {
  event_id: EventInterface['id']
}

export class PublishEventService {
  async execute({ event_id }: PublishEventProps) {

    const event = await Event.findOne({
      where: {
        id: event_id
      }
    })

    if (!event) {
      throw new NotFoundError("Event Not Found")
    }

    if (event.status !== "draft") {
      throw new BadRequestError("Cannot be possible to publish an event with status other than draft")
    }

    if (event.starts_at <= new Date()) {
      throw new BadRequestError("Cannot be possible to publish an event whose start date is in the past")
    }

    await Event.update({
      status: "published",
    },
      {
        where: {
          id: event_id
        }
      }
    )
  }
}
