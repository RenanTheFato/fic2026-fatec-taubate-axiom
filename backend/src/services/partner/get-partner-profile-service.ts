import { QueryTypes } from "sequelize";
import { NotFoundError } from "../../config/errors.js";
import { sequelize } from "../../config/sequelize.js";
import { Partner } from "../../models/partner-model.js";
import { PROPOSAL_STATUSES } from "../../models/partner-proposal-model.js";
import type { ProposalStatus } from "../../models/partner-proposal-model.js";
import { User } from "../../models/user-model.js";

type CountRow = { status: ProposalStatus, total: number }

type ContributedRow = { total: string | null, count: number }

// O cadastro da empresa que está no painel, com a situação do pedido e os números do retorno: as
// propostas por situação e o que já entrou de fato, somado pelo banco a partir das transações
// confirmadas. Aporte aceito e não pago não conta: o número é do dinheiro que chegou.
export class GetPartnerProfileService {
  async execute({ user_id }: { user_id: string }) {

    const partner = await Partner.findOne({
      where: { user_id },
      include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
    })

    if (!partner) {
      throw new NotFoundError("Partner Not Found")
    }

    const [counts, contributed] = await Promise.all([
      sequelize.query<CountRow>(
        `SELECT status, COUNT(*) AS total FROM partner_proposals WHERE partner_id = :partner GROUP BY status`,
        { type: QueryTypes.SELECT, replacements: { partner: partner.id } }
      ),
      sequelize.query<ContributedRow>(
        `SELECT SUM(payment.amount) AS total, COUNT(payment.id) AS count
           FROM partner_proposals proposal
           JOIN transactions payment ON payment.id = proposal.transaction_id
          WHERE proposal.partner_id = :partner AND payment.status = 'confirmed'`,
        { type: QueryTypes.SELECT, replacements: { partner: partner.id } }
      ),
    ])

    const proposals = Object.fromEntries(PROPOSAL_STATUSES.map((status) => [
      status,
      Number(counts.find((row) => row.status === status)?.total ?? 0),
    ])) as Record<ProposalStatus, number>

    return {
      ...partner.get({ plain: true }),
      summary: {
        proposals,
        contributed: contributed[0]?.total ?? "0.00",
        contributions: Number(contributed[0]?.count ?? 0),
      },
    }
  }
}
