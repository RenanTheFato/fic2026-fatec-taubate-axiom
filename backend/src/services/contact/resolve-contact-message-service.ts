import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { ContactMessageInterface } from "../../interfaces/contact-message-interface.js";
import { ContactMessage, CONTACT_CHANNELS_BY_ROLE } from "../../models/contact-message-model.js";
import type { UserRole } from "../../models/user-model.js";

interface ResolveContactMessageProps {
  id: ContactMessageInterface['id'],
  role: UserRole | undefined,
  resolved_by: ContactMessageInterface['resolved_by'],
}

export class ResolveContactMessageService {
  async execute({ id, role, resolved_by }: ResolveContactMessageProps) {

    const contact = await ContactMessage.findByPk(id)

    // Mensagem de um canal que o papel não lê responde como inexistente: a Comunicação não fica
    // sabendo nem que a ouvidoria recebeu alguma coisa.
    if (!contact || !role || !CONTACT_CHANNELS_BY_ROLE[role].includes(contact.channel)) {
      throw new NotFoundError("Contact Message Not Found")
    }

    if (contact.status === "resolved") {
      throw new BadRequestError("This message has already been resolved")
    }

    await contact.update({ status: "resolved", resolved_at: new Date(), resolved_by })

    return contact.get({ plain: true })
  }
}
