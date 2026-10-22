import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { PartnerInterface } from "../../interfaces/partner-interface.js";
import { Partner } from "../../models/partner-model.js";

type ResubmitPartnerProps = { user_id: string } & Pick<PartnerInterface, 'interests' | 'message'>

// A empresa que teve o pedido recusado pode mandar de novo pelo painel, com o texto revisto, em vez
// de criar outra conta. O pedido volta para a fila da associação como um pedido novo.
export class ResubmitPartnerService {
  async execute({ user_id, interests, message }: ResubmitPartnerProps) {

    const partner = await Partner.findOne({ where: { user_id } })

    if (!partner) {
      throw new NotFoundError("Partner Not Found")
    }

    if (partner.status !== "refused") {
      throw new BadRequestError("Only a refused request can be sent again")
    }

    await partner.update({
      interests,
      message,
      status: "pending",
      review_note: null,
      reviewed_at: null,
      reviewed_by: null,
    })

    return partner.get({ plain: true })
  }
}
