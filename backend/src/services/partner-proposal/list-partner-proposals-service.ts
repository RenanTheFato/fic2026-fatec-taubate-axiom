import { Campaign } from "../../models/campaign-model.js";
import { Event } from "../../models/event-model.js";
import { Partner } from "../../models/partner-model.js";
import { PartnerProposal } from "../../models/partner-proposal-model.js";
import type { ProposalKind, ProposalStatus } from "../../models/partner-proposal-model.js";
import { Transaction } from "../../models/transaction-model.js";
import { User } from "../../models/user-model.js";

interface ListPartnerProposalsProps {
  status: ProposalStatus | null,
  kind: ProposalKind | null,
  page: number,
  limit: number,
}

// As propostas de todos os parceiros, para a associação responder. Cada uma traz a empresa, o
// destino e, depois de aceita, a situação do pagamento: é o que diz se o aporte já chegou.
export class ListPartnerProposalsService {
  async execute({ status, kind, page, limit }: ListPartnerProposalsProps) {

    const { rows, count: total } = await PartnerProposal.findAndCountAll({
      where: {
        ...(status ? { status } : {}),
        ...(kind ? { kind } : {}),
      },
      include: [
        {
          model: Partner,
          as: "partner",
          attributes: ["id", "company_name", "phone"],
          include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
        },
        { model: Campaign, as: "campaign", attributes: ["id", "title", "slug"] },
        { model: Event, as: "event", attributes: ["id", "title", "slug"] },
        { model: Transaction, as: "transaction", attributes: ["id", "status", "amount"] },
        { model: User, as: "reviewer", attributes: ["id", "name"] },
      ],
      order: [["created_at", "DESC"], ["id", "ASC"]],
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    })

    const pending = await PartnerProposal.count({ where: { status: "pending" } })

    return { proposals: rows.map((row) => row.get({ plain: true })), total, pending }
  }
}
