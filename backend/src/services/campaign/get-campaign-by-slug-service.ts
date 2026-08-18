import { Op } from "sequelize";
import { CampaignInterface } from "../../interfaces/campaign-interface.js";
import { Campaign } from "../../models/campaign-model.js";
import { NotFoundError } from "../../config/errors.js";

export class GetCampaignBySlugService {
  async execute({ slug }: Pick<CampaignInterface, 'slug'>) {
    const campaign = await Campaign.findOne({
      where: {
        slug,
        status: {
          [Op.in]: ["active", "finished"]
        },
      },
      raw: true
    })

    if (!campaign) {
      throw new NotFoundError("Campaign Not Found")
    }

    const raised = Number(campaign.raised_amount)
    const goal = Number(campaign.goal_amount)

    const percentualCompleted = goal > 0 ? (raised / goal) * 100 : 0

    return {
      ...campaign,
      percentual_completed: percentualCompleted
    }

  }
}