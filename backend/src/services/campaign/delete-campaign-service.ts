import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { CampaignInterface } from "../../interfaces/campaign-interface.js";
import { Campaign } from "../../models/campaign-model.js";

interface DeleteCampaignProps {
  campaign_id: CampaignInterface['id']
}

export class DeleteCampaignService {
  async execute({ campaign_id }: DeleteCampaignProps) {

    const campaign = await Campaign.findOne({
      where: {
        id: campaign_id
      }
    })

    if (!campaign) {
      throw new NotFoundError("Campaign Not Found")
    }

    if (campaign.status !== "draft") {
      throw new BadRequestError("Cannot be possible to delete a campaign with status other than draft")
    }

    await Campaign.destroy(
      {
        where: {
          id: campaign_id
        }
      }
    )
  }
}