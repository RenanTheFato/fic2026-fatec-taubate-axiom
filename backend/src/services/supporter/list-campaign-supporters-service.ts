import { Op } from "sequelize";
import { NotFoundError } from "../../config/errors.js";
import { Campaign } from "../../models/campaign-model.js";
import { ListSupportersService } from "./list-supporters-service.js";

interface ListCampaignSupportersProps {
  slug: string,
  seed: string | null,
  page: number,
  limit: number,
}

// Só campanha visível tem mural visível: rascunho e cancelada respondem 404, como no detalhe.
export class ListCampaignSupportersService {
  async execute({ slug, seed, page, limit }: ListCampaignSupportersProps) {
    const campaign = await Campaign.findOne({
      where: { slug, status: { [Op.in]: ["active", "finished"] } },
      attributes: ["id"],
    })

    if (!campaign) {
      throw new NotFoundError("Campaign Not Found")
    }

    return await new ListSupportersService().execute({ scope: { campaign_id: campaign.id }, seed, page, limit })
  }
}
