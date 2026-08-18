import { Campaign } from "../../models/campaign-model.js";

export class ListAllCampaignsService {
  async execute({ page, limit }: { page: number, limit: number }) {

    const campaigns = await Campaign.findAll({
      limit: limit,
      offset: (page - 1) * limit
    })

    return campaigns
  }
}