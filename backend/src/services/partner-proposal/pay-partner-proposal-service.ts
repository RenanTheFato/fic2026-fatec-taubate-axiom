import { BadRequestError, ForbiddenError, NotFoundError } from "../../config/errors.js";
import { Partner } from "../../models/partner-model.js";
import { PartnerProposal, PAYABLE_KINDS } from "../../models/partner-proposal-model.js";
import { Transaction } from "../../models/transaction-model.js";
import { User } from "../../models/user-model.js";
import { CreateTransactionService } from "../transaction/create-transaction-service.js";

// O aporte aceito vira dinheiro pelo mesmo caminho de qualquer doação: uma transação pending, o
// checkout do gateway e a confirmação pelo webhook, que soma na campanha e emite o recibo no nome e
// no CNPJ da empresa. Nada aqui marca a proposta como paga: quem diz isso é a transação.
export class PayPartnerProposalService {
  async execute({ id, user_id }: { id: string, user_id: string }) {

    const partner = await Partner.findOne({
      where: { user_id },
      include: [{ model: User, as: "user", attributes: ["email"] }],
    })

    const proposal = partner ? await PartnerProposal.findOne({ where: { id, partner_id: partner.id } }) : null

    if (!partner || !proposal) {
      throw new NotFoundError("Proposal Not Found")
    }

    if (partner.status !== "approved") {
      throw new ForbiddenError("Only an approved partner can pay a proposal")
    }

    if (!PAYABLE_KINDS.includes(proposal.kind) || !proposal.amount) {
      throw new BadRequestError("Only a contribution or a sponsorship is paid through the site")
    }

    if (proposal.status !== "accepted") {
      throw new BadRequestError("Only an accepted proposal can be paid")
    }

    // Um segundo clique em "pagar" não pode abrir uma segunda cobrança. Se a anterior ainda espera
    // o pagamento, volta o mesmo checkout; se ela morreu sem pagar, abre outra.
    if (proposal.transaction_id) {
      const previous = await Transaction.findByPk(proposal.transaction_id, { attributes: ["id", "status", "checkout_url"] })

      if (previous?.status === "confirmed" || previous?.status === "refunded") {
        throw new BadRequestError("This proposal has already been paid")
      }

      if (previous?.status === "awaiting_confirmation") {
        throw new BadRequestError("The payment of this proposal is being processed")
      }

      if (previous?.status === "pending" && previous.checkout_url) {
        return { transaction_id: previous.id, checkout_url: previous.checkout_url }
      }
    }

    const related = partner as Partner & { user?: User | null }

    const transaction = await new CreateTransactionService().execute({
      type: proposal.kind === "sponsorship" ? "sponsorship" : "donation",
      amount: proposal.amount,
      items: [],
      campaign_id: proposal.campaign_id,
      event_id: proposal.event_id,
      notes: `Proposta de parceria: ${proposal.title}`,
      donor_name: partner.company_name,
      donor_email: related.user?.email ?? "",
      donor_document: partner.document,
      donor_phone: partner.phone,
      // A empresa autorizou a marca na rede de parceiros; o mesmo consentimento vale para o mural.
      public_recognition: partner.public_listing,
    })

    await proposal.update({ transaction_id: transaction.id })

    return { transaction_id: transaction.id, checkout_url: transaction.checkout_url ?? null }
  }
}
