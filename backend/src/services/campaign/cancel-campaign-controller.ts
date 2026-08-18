import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { CampaignInterface } from "../../interfaces/campaign-interface.js";
import { Campaign } from "../../models/campaign-model.js";

interface CancelCampaignProps {
  campaign_id: CampaignInterface['id']
}

export class CancelCampaignService {
  async execute({ campaign_id }: CancelCampaignProps) {

    const campaign = await Campaign.findOne({
      where: {
        id: campaign_id
      }
    })

    if (!campaign) {
      throw new NotFoundError("Campaign Not Found")
    }

    if (campaign.status !== "active" && campaign.status !== "draft") {
      throw new BadRequestError("Cannot be possible to cancel a campaign with status other than active or draft")
    }

    await Campaign.update({
      status: "cancelled",
    },
      {
        where: {
          id: campaign_id
        }
      }
    )
  }
}