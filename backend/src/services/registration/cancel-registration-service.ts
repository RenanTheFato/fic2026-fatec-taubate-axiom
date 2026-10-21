import { literal } from "sequelize";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { sequelize } from "../../config/sequelize.js";
import { RegistrationInterface } from "../../interfaces/registration-interface.js";
import { Event } from "../../models/event-model.js";
import { Registration } from "../../models/registration-model.js";
import { formatTicketCode } from "../../utils/ticket-code.js";

// Cancela a inscrição gratuita e devolve a vaga para a agenda. O convite pago fica de fora: a
// vaga dele foi paga, e quem a libera é o estorno da transação, que devolve o dinheiro, cancela o
// recibo e cancela esta inscrição junto. Cancelar só a inscrição deixaria a associação com o
// dinheiro de quem não vai entrar.
export class CancelRegistrationService {
  async execute({ id }: Pick<RegistrationInterface, 'id'>) {

    return await sequelize.transaction(async (t) => {
      const registration = await Registration.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE })

      if (!registration) {
        throw new NotFoundError("Registration Not Found")
      }

      if (registration.transaction_id) {
        throw new BadRequestError("A paid ticket is cancelled by refunding its transaction")
      }

      if (registration.status !== "confirmed") {
        throw new BadRequestError("This registration has already been cancelled")
      }

      if (registration.checked_in_at) {
        throw new BadRequestError("Cannot cancel a registration that has already been checked in")
      }

      await registration.update({ status: "cancelled", cancelled_at: new Date() }, { transaction: t })

      // O GREATEST protege a coluna UNSIGNED, como no estorno do convite.
      await Event.update(
        { taken_seats: literal("GREATEST(taken_seats - 1, 0)") },
        { where: { id: registration.event_id }, transaction: t }
      )

      const plain = registration.get({ plain: true })

      return { ...plain, ticket_code: formatTicketCode(plain.ticket_code) }
    })
  }
}
