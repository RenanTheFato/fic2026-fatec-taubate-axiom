import { NotFoundError } from "../../config/errors.js";
import { Campaign } from "../../models/campaign-model.js";
import { Event } from "../../models/event-model.js";
import { Partner } from "../../models/partner-model.js";
import { PartnerProposal } from "../../models/partner-proposal-model.js";
import { Receipt } from "../../models/receipt-model.js";
import { Transaction } from "../../models/transaction-model.js";

// As propostas da empresa que está no painel, com o pagamento e o recibo de cada aporte. O recibo
// só aparece com a transação confirmada, porque antes disso não existe documento; o hash dele é o
// que leva à conferência pública e à segunda via do certificado.
export class ListMyPartnerProposalsService {
  async execute({ user_id }: { user_id: string }) {

    const partner = await Partner.findOne({ where: { user_id }, attributes: ["id"] })

    if (!partner) {
      throw new NotFoundError("Partner Not Found")
    }

    const proposals = await PartnerProposal.findAll({
      where: { partner_id: partner.id },
      include: [
        { model: Campaign, as: "campaign", attributes: ["id", "title", "slug"] },
        { model: Event, as: "event", attributes: ["id", "title", "slug"] },
        {
          model: Transaction,
          as: "transaction",
          attributes: ["id", "status", "amount"],
          include: [{ model: Receipt, as: "receipt", attributes: ["number", "hash", "status"] }],
        },
      ],
      order: [["created_at", "DESC"], ["id", "ASC"]],
      limit: 100,
    })

    return proposals.map((row) => {
      const plain = row.get({ plain: true }) as ReturnType<PartnerProposal["get"]> & {
        transaction?: { id: string, status: string, amount: string, receipt?: { number: string, hash: string, status: string } | null } | null,
      }
      const { transaction, ...proposal } = plain

      return {
        ...proposal,
        payment: transaction
          ? {
            transaction_id: transaction.id,
            status: transaction.status,
            amount: transaction.amount,
            receipt: transaction.status === "confirmed" || transaction.status === "refunded" ? transaction.receipt ?? null : null,
          }
          : null,
      }
    })
  }
}
