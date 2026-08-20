import { Op } from "sequelize";
import { Campaign } from "../../models/campaign-model.js";

export class ListCampaignsService {
  async execute({ page, limit }: { page: number, limit: number }) {

    const { rows: campaigns, count: total } = await Campaign.findAndCountAll({
      where: {
        status: {
          [Op.in]: ["active", "finished"]
        },
      },
      order: [
        ["status", "ASC"],
        ["starts_at", "DESC"],
        ["id", "ASC"]
      ],
      limit: limit,
      offset: (page - 1) * limit
    })

    return { campaigns, total }
  }
}
