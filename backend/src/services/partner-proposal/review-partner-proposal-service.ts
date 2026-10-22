import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { PartnerProposalInterface } from "../../interfaces/partner-proposal-interface.js";
import { PartnerProposal } from "../../models/partner-proposal-model.js";

interface ReviewPartnerProposalProps {
  id: PartnerProposalInterface['id'],
  decision: "accepted" | "refused",
  note: PartnerProposalInterface['response_note'],
  reviewed_by: PartnerProposalInterface['reviewed_by'],
}

// A resposta da associação à proposta. Aceitar um aporte ou patrocínio libera o pagamento no painel
// da empresa; as outras propostas aceitas seguem pelo contato da equipe, e a nota diz como.
export class ReviewPartnerProposalService {
  async execute({ id, decision, note, reviewed_by }: ReviewPartnerProposalProps) {

    const proposal = await PartnerProposal.findByPk(id)

    if (!proposal) {
      throw new NotFoundError("Proposal Not Found")
    }

    if (proposal.status !== "pending") {
      throw new BadRequestError("This proposal has already been answered")
    }

    await proposal.update({ status: decision, response_note: note, reviewed_at: new Date(), reviewed_by })

    return proposal.get({ plain: true })
  }
}
