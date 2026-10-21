import { Op } from "sequelize";
import { ContactMessage, CONTACT_CHANNELS_BY_ROLE } from "../../models/contact-message-model.js";
import type { ContactChannel, ContactStatus } from "../../models/contact-message-model.js";
import { Donor } from "../../models/donor-model.js";
import { Transaction } from "../../models/transaction-model.js";
import { User } from "../../models/user-model.js";
import type { UserRole } from "../../models/user-model.js";

interface ListContactMessagesProps {
  role: UserRole | undefined,
  status: ContactStatus | null,
  channel: ContactChannel | null,
  page: number,
  limit: number,
}

export type WallStatus = "listed" | "not_listed" | "no_donor"

export class ListContactMessagesService {
  async execute({ role, status, channel, page, limit }: ListContactMessagesProps) {

    const visible = role ? CONTACT_CHANNELS_BY_ROLE[role] : []
    const channels = channel ? visible.filter((item) => item === channel) : [...visible]

    if (channels.length === 0) {
      return { contacts: [], total: 0, open: 0 }
    }

    const { rows, count: total } = await ContactMessage.findAndCountAll({
      where: {
        channel: { [Op.in]: channels },
        ...(status ? { status } : {}),
      },
      include: [{ model: User, as: "resolver", attributes: ["id", "name"] }],
      order: [["created_at", "DESC"], ["id", "ASC"]],
      limit,
      offset: (page - 1) * limit,
    })

    // O número da aba "abertas" não depende do filtro de situação da página.
    const open = await ContactMessage.count({
      where: { channel: { [Op.in]: channels }, status: "open" },
    })

    const contacts = rows.map((row) => row.get({ plain: true }))
    const wall = await this.wallStatus(contacts.filter((contact) => contact.channel === "wall_removal").map((contact) => contact.email))

    return {
      contacts: contacts.map((contact) => ({
        ...contact,
        wall_status: contact.channel === "wall_removal" ? wall.get(contact.email.toLowerCase()) ?? "no_donor" : null,
      })),
      total,
      open,
    }
  }

  // Para o pedido de retirada, a equipe precisa saber se há o que retirar: se o e-mail é de algum
  // doador e se o nome dele ainda aparece no mural. São duas consultas para a página inteira, e
  // nenhum valor entra nelas.
  private async wallStatus(emails: string[]) {
    const status = new Map<string, WallStatus>()

    if (emails.length === 0) {
      return status
    }

    const donors = await Donor.findAll({
      where: { email: { [Op.in]: emails }, anonymized_at: null },
      attributes: ["id", "email"],
    })

    if (donors.length === 0) {
      return status
    }

    const listed = await Transaction.findAll({
      where: {
        donor_id: { [Op.in]: donors.map((donor) => donor.id) },
        status: "confirmed",
        public_recognition: true,
      },
      attributes: ["donor_id"],
      group: ["donor_id"],
    })

    const listedDonors = new Set(listed.map((transaction) => transaction.donor_id))

    for (const donor of donors) {
      const email = donor.email.toLowerCase()

      if (status.get(email) !== "listed") {
        status.set(email, listedDonors.has(donor.id) ? "listed" : "not_listed")
      }
    }

    return status
  }
}
