import { Op } from "sequelize";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { sequelize } from "../../config/sequelize.js";
import { ContactMessageInterface } from "../../interfaces/contact-message-interface.js";
import { ContactMessage, CONTACT_CHANNELS_BY_ROLE } from "../../models/contact-message-model.js";
import { Donor } from "../../models/donor-model.js";
import { Transaction } from "../../models/transaction-model.js";
import type { UserRole } from "../../models/user-model.js";

interface WithdrawFromWallProps {
  id: ContactMessageInterface['id'],
  role: UserRole | undefined,
  resolved_by: ContactMessageInterface['resolved_by'],
}

// Atende o pedido de retirada: desmarca o consentimento em toda contribuição do doador e dá o
// pedido por resolvido, na mesma transação de banco. O nome some do mural do site, da campanha e
// do evento de uma vez, porque os três leem a mesma coluna. Nada é apagado: a contribuição, o
// recibo e o certificado continuam valendo, só o agradecimento público deixa de existir.
//
// Todos os cadastros com o e-mail do pedido entram: a mesma pessoa pode ter doado uma vez com CPF
// e outra sem, e o pedido é dela, não de um cadastro.
export class WithdrawFromWallService {
  async execute({ id, role, resolved_by }: WithdrawFromWallProps) {

    return await sequelize.transaction(async (t) => {
      const contact = await ContactMessage.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE })

      if (!contact || !role || !CONTACT_CHANNELS_BY_ROLE[role].includes(contact.channel)) {
        throw new NotFoundError("Contact Message Not Found")
      }

      if (contact.channel !== "wall_removal") {
        throw new BadRequestError("Only a supporters wall removal request can withdraw a name from the wall")
      }

      const donors = await Donor.findAll({
        where: { email: contact.email, anonymized_at: null },
        attributes: ["id"],
        transaction: t,
      })

      if (donors.length === 0) {
        throw new BadRequestError("No donor uses the e-mail of this request")
      }

      const [withdrawn] = await Transaction.update(
        { public_recognition: false },
        {
          where: { donor_id: { [Op.in]: donors.map((donor) => donor.id) }, public_recognition: true },
          transaction: t,
        }
      )

      await contact.update({ status: "resolved", resolved_at: new Date(), resolved_by }, { transaction: t })

      return { contact: contact.get({ plain: true }), withdrawn }
    })
  }
}
