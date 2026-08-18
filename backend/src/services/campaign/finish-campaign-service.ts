import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { CampaignInterface } from "../../interfaces/campaign-interface.js";
import { Campaign } from "../../models/campaign-model.js";

interface FinishCampaignProps {
  campaign_id: CampaignInterface['id']
}

export class FinishCampaignService {
  async execute({ campaign_id }: FinishCampaignProps) {

    const campaign = await Campaign.findOne({
      where: {
        id: campaign_id
      }
    })

    if (!campaign) {
      throw new NotFoundError("Campaign Not Found")
    }

    if (campaign.status !== "active") {
      throw new BadRequestError("Cannot be possible to finish a campaign with status other than active")
    }

    await Campaign.update({
      status: "finished",
    },
      {
        where: {
          id: campaign_id
        }
      }
    )
  }
}