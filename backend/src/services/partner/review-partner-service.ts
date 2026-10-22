import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { PartnerInterface } from "../../interfaces/partner-interface.js";
import { Partner } from "../../models/partner-model.js";

interface ReviewPartnerProps {
  id: PartnerInterface['id'],
  decision: "approved" | "refused",
  note: PartnerInterface['review_note'],
  reviewed_by: PartnerInterface['reviewed_by'],
}

// A decisão da associação sobre o pedido. Aprovar libera o painel completo da empresa, onde ela
// passa a sugerir campanhas, aportes e patrocínios; recusar deixa o motivo para ela ler no painel.
export class ReviewPartnerService {
  async execute({ id, decision, note, reviewed_by }: ReviewPartnerProps) {

    const partner = await Partner.findByPk(id)

    if (!partner) {
      throw new NotFoundError("Partner Not Found")
    }

    if (partner.status !== "pending") {
      throw new BadRequestError("This request has already been reviewed")
    }

    await partner.update({ status: decision, review_note: note, reviewed_at: new Date(), reviewed_by })

    return partner.get({ plain: true })
  }
}
