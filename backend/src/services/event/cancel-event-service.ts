import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { EventInterface } from "../../interfaces/event-interface.js";
import { Event } from "../../models/event-model.js";

interface CancelEventProps {
  event_id: EventInterface['id']
}

export class CancelEventService {
  async execute({ event_id }: CancelEventProps) {

    const event = await Event.findOne({
      where: {
        id: event_id
      }
    })

    if (!event) {
      throw new NotFoundError("Event Not Found")
    }

    if (event.status !== "published" && event.status !== "draft") {
      throw new BadRequestError("Cannot be possible to cancel an event with status other than published or draft")
    }

    await Event.update({
      status: "cancelled",
    },
      {
        where: {
          id: event_id
        }
      }
    )
  }
}
