import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { EventInterface } from "../../interfaces/event-interface.js";
import { Event } from "../../models/event-model.js";

interface DeleteEventProps {
  event_id: EventInterface['id']
}

export class DeleteEventService {
  async execute({ event_id }: DeleteEventProps) {

    const event = await Event.findOne({
      where: {
        id: event_id
      }
    })

    if (!event) {
      throw new NotFoundError("Event Not Found")
    }

    if (event.status !== "draft") {
      throw new BadRequestError("Cannot be possible to delete an event with status other than draft")
    }

    await Event.destroy(
      {
        where: {
          id: event_id
        }
      }
    )
  }
}
