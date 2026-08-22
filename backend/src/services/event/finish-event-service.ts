import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { EventInterface } from "../../interfaces/event-interface.js";
import { Event } from "../../models/event-model.js";

interface FinishEventProps {
  event_id: EventInterface['id']
}

export class FinishEventService {
  async execute({ event_id }: FinishEventProps) {

    const event = await Event.findOne({
      where: {
        id: event_id
      }
    })

    if (!event) {
      throw new NotFoundError("Event Not Found")
    }

    if (event.status !== "published") {
      throw new BadRequestError("Cannot be possible to finish an event with status other than published")
    }

    await Event.update({
      status: "finished",
    },
      {
        where: {
          id: event_id
        }
      }
    )
  }
}
