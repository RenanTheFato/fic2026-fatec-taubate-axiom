import { Transaction as DatabaseTransaction } from "sequelize";
import { NotFoundError } from "../../config/errors.js";
import { Donor } from "../../models/donor-model.js";
import { Registration } from "../../models/registration-model.js";
import { Transaction } from "../../models/transaction-model.js";
import { generateTicketCode } from "../../utils/ticket-code.js";

interface IssueTicketRegistrationProps {
  transaction: Transaction,
  database_transaction: DatabaseTransaction,
}

// A inscrição do convite pago. Roda dentro da confirmação, na mesma transação de banco que debita
// a vaga e emite o recibo: vaga ocupada sem nome na lista de presença é o estado parcial que a
// confirmação existe para impedir. Quem comprou é quem entra, então o participante é o doador.
export class IssueTicketRegistrationService {
  async execute({ transaction, database_transaction }: IssueTicketRegistrationProps) {

    const donor = await Donor.findByPk(transaction.donor_id, { transaction: database_transaction })

    if (!donor || !transaction.event_id) {
      throw new NotFoundError("Donor Not Found")
    }

    return await Registration.create({
      event_id: transaction.event_id,
      transaction_id: transaction.id,
      ticket_code: generateTicketCode(),
      participant_name: donor.name,
      participant_email: donor.email,
      participant_phone: donor.phone,
      status: "confirmed",
    }, { transaction: database_transaction })
  }
}
