import { BadRequestError, ForbiddenError, NotFoundError } from "../../config/errors.js";
import { PartnerProposalInterface } from "../../interfaces/partner-proposal-interface.js";
import { Campaign } from "../../models/campaign-model.js";
import { Event } from "../../models/event-model.js";
import { Partner } from "../../models/partner-model.js";
import { PartnerProposal } from "../../models/partner-proposal-model.js";

type CreatePartnerProposalProps = { user_id: string }
  & Pick<PartnerProposalInterface, 'kind' | 'title' | 'description' | 'amount' | 'campaign_id' | 'event_id'>

// Uma sugestão do parceiro aprovado: campanha, aporte, patrocínio, doação de produto ou serviço,
// voluntariado da equipe. Nasce em análise, e nada acontece no caixa até a associação aceitar e a
// empresa pagar pelo checkout.
export class CreatePartnerProposalService {
  async execute({ user_id, kind, title, description, amount, campaign_id, event_id }: CreatePartnerProposalProps) {

    const partner = await Partner.findOne({ where: { user_id }, attributes: ["id", "status"] })

    if (!partner) {
      throw new NotFoundError("Partner Not Found")
    }

    if (partner.status !== "approved") {
      throw new ForbiddenError("Only an approved partner can send proposals")
    }

    // O destino precisa estar recebendo dinheiro hoje, pela mesma regra do checkout: aceitar
    // patrocínio para campanha encerrada só adiaria a recusa para a hora de pagar.
    if (campaign_id) {
      const campaign = await Campaign.findByPk(campaign_id, { attributes: ["id", "status"] })

      if (!campaign || campaign.status !== "active") {
        throw new BadRequestError("The campaign must be active to receive a proposal")
      }
    }

    if (event_id) {
      const event = await Event.findByPk(event_id, { attributes: ["id", "status"] })

      if (!event || event.status !== "published") {
        throw new BadRequestError("The event must be published to receive a proposal")
      }
    }

    const proposal = await PartnerProposal.create({
      partner_id: partner.id,
      kind,
      title,
      description,
      amount,
      campaign_id,
      event_id,
      status: "pending",
    })

    return proposal.get({ plain: true })
  }
}
