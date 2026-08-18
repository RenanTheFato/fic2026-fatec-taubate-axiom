import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { CampaignInterface } from "../../interfaces/campaign-interface.js";
import { Campaign } from "../../models/campaign-model.js";

interface PublishCampaignProps {
  campaign_id: CampaignInterface['id']
}

export class PublishCampaignService {
  async execute({ campaign_id }: PublishCampaignProps) {

    const campaign = await Campaign.findOne({
      where: {
        id: campaign_id
      }
    })

    if (!campaign) {
      throw new NotFoundError("Campaign Not Found")
    }

    if (campaign.status !== "draft") {
      throw new BadRequestError("Cannot be possible to publish a campaign with status other than draft")
    }

    if (Number(campaign.goal_amount) < 0) {
      throw new BadRequestError("Cannot be possible to publish a goal lower than zero")
    }

    if (campaign.starts_at === null) {
      throw new BadRequestError("Cannot be possible to publish a no start date")
    }

    await Campaign.update({
      status: "active",
    },
      {
        where: {
          id: campaign_id
        }
      }
    )
  }
}