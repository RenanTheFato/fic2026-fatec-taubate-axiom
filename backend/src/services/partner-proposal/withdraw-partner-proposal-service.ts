import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { Partner } from "../../models/partner-model.js";
import { PartnerProposal } from "../../models/partner-proposal-model.js";

// A empresa desiste de uma proposta que a associação ainda não analisou. Proposta de outra empresa
// responde como inexistente: o id não é prova de nada.
export class WithdrawPartnerProposalService {
  async execute({ id, user_id }: { id: string, user_id: string }) {

    const partner = await Partner.findOne({ where: { user_id }, attributes: ["id"] })
    const proposal = partner ? await PartnerProposal.findOne({ where: { id, partner_id: partner.id } }) : null

    if (!proposal) {
      throw new NotFoundError("Proposal Not Found")
    }

    if (proposal.status !== "pending") {
      throw new BadRequestError("Only a proposal under review can be withdrawn")
    }

    await proposal.update({ status: "withdrawn" })

    return proposal.get({ plain: true })
  }
}
