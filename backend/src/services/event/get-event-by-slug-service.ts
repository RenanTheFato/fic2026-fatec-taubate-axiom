import { Op } from "sequelize";
import { Event } from "../../models/event-model.js";
import { NotFoundError } from "../../config/errors.js";
import { EventInterface } from "../../interfaces/event-interface.js";

export class GetEventBySlugService {
  async execute({ slug }: Pick<EventInterface, 'slug'>) {
    const event = await Event.findOne({
      where: {
        slug,
        status: {
          [Op.in]: ["published", "finished"]
        },
      },
      raw: true
    })

    if (!event) {
      throw new NotFoundError("Event Not Found")
    }

    return event

  }
}