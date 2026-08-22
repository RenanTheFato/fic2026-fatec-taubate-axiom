import { Event } from "../../models/event-model.js";

export class ListAllEventsService {
  async execute({ page, limit }: { page: number, limit: number }) {

    const { rows: events, count: total } = await Event.findAndCountAll({
      order: [
        ["starts_at", "DESC"],
        ["slug", "ASC"],
        ["ticket_price", "ASC"],
        ["id", "ASC"]
      ],
      limit: limit,
      offset: (page - 1) * limit
    })

    return { events, total }
  }
}
