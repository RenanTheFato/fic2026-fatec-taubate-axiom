import { Op } from "sequelize";
import { NotFoundError } from "../../config/errors.js";
import { Event } from "../../models/event-model.js";
import { ListSupportersService } from "./list-supporters-service.js";

interface ListEventSupportersProps {
  slug: string,
  seed: string | null,
  page: number,
  limit: number,
}

export class ListEventSupportersService {
  async execute({ slug, seed, page, limit }: ListEventSupportersProps) {
    const event = await Event.findOne({
      where: { slug, status: { [Op.in]: ["published", "finished"] } },
      attributes: ["id"],
    })

    if (!event) {
      throw new NotFoundError("Event Not Found")
    }

    return await new ListSupportersService().execute({ scope: { event_id: event.id }, seed, page, limit })
  }
}
