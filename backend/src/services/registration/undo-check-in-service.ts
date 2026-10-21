import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { RegistrationInterface } from "../../interfaces/registration-interface.js";
import { Registration } from "../../models/registration-model.js";
import { formatTicketCode } from "../../utils/ticket-code.js";

// Desfaz a entrada marcada na linha errada. Existe porque a lista de presença vira dado do evento,
// e um clique trocado na porta não pode virar presença de quem não veio.
export class UndoCheckInService {
  async execute({ id }: Pick<RegistrationInterface, 'id'>) {

    const registration = await Registration.findByPk(id)

    if (!registration) {
      throw new NotFoundError("Registration Not Found")
    }

    if (!registration.checked_in_at) {
      throw new BadRequestError("This ticket has not been checked in")
    }

    await registration.update({ checked_in_at: null, checked_in_by: null })

    const plain = registration.get({ plain: true })

    return { ...plain, ticket_code: formatTicketCode(plain.ticket_code) }
  }
}
