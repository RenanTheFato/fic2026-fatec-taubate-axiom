import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { sequelize } from "../../config/sequelize.js";
import { Event } from "../../models/event-model.js";
import { Registration } from "../../models/registration-model.js";
import { formatTicketCode, normalizeTicketCode } from "../../utils/ticket-code.js";

interface CheckInRegistrationProps {
  code: string,
  event_id: string,
  checked_in_by: string | null,
}

// A entrada na porta. O evento vem junto do código porque a portaria trabalha um evento por vez:
// um ingresso válido de outra noite do Chefs do Bem não pode passar só por existir. Duas portas
// lendo o mesmo ingresso ao mesmo tempo se enfileiram na trava da linha, e a segunda vê a entrada
// que a primeira acabou de registrar.
export class CheckInRegistrationService {
  async execute({ code, event_id, checked_in_by }: CheckInRegistrationProps) {

    return await sequelize.transaction(async (t) => {
      const registration = await Registration.findOne({
        where: { ticket_code: normalizeTicketCode(code) },
        transaction: t,
        lock: t.LOCK.UPDATE,
      })

      if (!registration) {
        throw new NotFoundError("Registration Not Found")
      }

      if (registration.event_id !== event_id) {
        throw new BadRequestError("This ticket belongs to another event")
      }

      if (registration.status !== "confirmed") {
        throw new BadRequestError("This registration was cancelled")
      }

      if (registration.checked_in_at) {
        throw new BadRequestError("This ticket has already been checked in")
      }

      const event = await Event.findByPk(event_id, { attributes: ["id", "status"], transaction: t })

      if (!event || event.status === "cancelled" || event.status === "draft") {
        throw new BadRequestError("This event is not taking check-ins")
      }

      await registration.update({ checked_in_at: new Date(), checked_in_by }, { transaction: t })

      const plain = registration.get({ plain: true })

      return { ...plain, ticket_code: formatTicketCode(plain.ticket_code) }
    })
  }
}
