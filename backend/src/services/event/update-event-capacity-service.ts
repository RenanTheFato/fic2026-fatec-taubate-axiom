import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { EventInterface } from "../../interfaces/event-interface.js";
import { Event } from "../../models/event-model.js";

interface UpdateEventCapacityProps {
  event_id: EventInterface['id'],
  capacity: EventInterface['capacity'],
}

export class UpdateEventCapacityService {
  async execute({ event_id, capacity }: UpdateEventCapacityProps) {
    const event = await Event.findByPk(event_id)

    if (!event) {
      throw new NotFoundError("Event Not Found")
    }

    if (capacity !== null && capacity < event.taken_seats) {
      throw new BadRequestError("Cannot be possible to set a capacity lower than the seats already taken")
    }

    await event.update({ capacity })

    return event.get({ plain: true })
  }
}
