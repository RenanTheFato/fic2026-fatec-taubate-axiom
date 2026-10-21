import { Op } from "sequelize";
import { NotFoundError } from "../../config/errors.js";
import { Event } from "../../models/event-model.js";
import { Registration } from "../../models/registration-model.js";
import { User } from "../../models/user-model.js";
import { formatTicketCode } from "../../utils/ticket-code.js";

interface ListEventRegistrationsProps {
  event_id: string,
  page: number,
  limit: number,
}

// A lista de presença. Vai em ordem alfabética porque é assim que a portaria procura um nome, e
// traz o evento junto para a tela montar o cabeçalho e a contagem de vagas com uma chamada só.
export class ListEventRegistrationsService {
  async execute({ event_id, page, limit }: ListEventRegistrationsProps) {

    const event = await Event.findByPk(event_id, {
      attributes: ["id", "title", "slug", "location", "starts_at", "ends_at", "ticket_price", "capacity", "taken_seats", "status"],
    })

    if (!event) {
      throw new NotFoundError("Event Not Found")
    }

    const { rows, count: total } = await Registration.findAndCountAll({
      where: { event_id },
      include: [{ model: User, as: "checker", attributes: ["id", "name"] }],
      order: [["participant_name", "ASC"], ["id", "ASC"]],
      limit,
      offset: (page - 1) * limit,
    })

    const confirmed = await Registration.count({ where: { event_id, status: "confirmed" } })
    const cancelled = await Registration.count({ where: { event_id, status: "cancelled" } })
    const checkedIn = await Registration.count({ where: { event_id, status: "confirmed", checked_in_at: { [Op.ne]: null } } })

    return {
      event: event.get({ plain: true }),
      registrations: rows.map((row) => {
        const registration = row.get({ plain: true })

        return { ...registration, ticket_code: formatTicketCode(registration.ticket_code) }
      }),
      total,
      summary: { confirmed, checked_in: checkedIn, cancelled },
    }
  }
}
