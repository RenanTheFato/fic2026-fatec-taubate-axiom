import { Op } from "sequelize";
import { Campaign } from "../../models/campaign-model.js";

export class ListCampaignsService {
  async execute({ page, limit }: { page: number, limit: number }) {

    const campaigns = await Campaign.findAll({
      where: {
        status: {
          [Op.in]: ["active", "finished"]
        },
      },
      limit: limit,
      offset: (page - 1) * limit
    })

    return campaigns
  }
}