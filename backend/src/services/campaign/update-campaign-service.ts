import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { CampaignInterface } from "../../interfaces/campaign-interface.js";
import { Campaign } from "../../models/campaign-model.js";

interface UpdateCampaignProps {
  campaign_id: CampaignInterface['id'],
  title?: CampaignInterface['title'],
  description?: CampaignInterface['description'],
  goal_amount?: CampaignInterface['goal_amount'],
  starts_at?: CampaignInterface['starts_at'],
  ends_at?: CampaignInterface['ends_at'],
}

export class UpdateCampaignService {
  async execute({ campaign_id, title, description, goal_amount, starts_at, ends_at }: UpdateCampaignProps) {

    const campaign = await Campaign.findOne({
      where: {
        id: campaign_id
      }
    })

    if (!campaign) {
      throw new NotFoundError("Campaign Not Found")
    }

    if (campaign.status === "finished" || campaign.status === "cancelled") {
      throw new BadRequestError("Cannot be possible to update a campaign with status finished or cancelled")
    }

    // As datas são validadas contra o que vai ficar gravado, não só contra o que veio no corpo,
    // senão mudar só o início conseguiria deixar a campanha terminando antes de começar.
    const nextStartsAt = starts_at ?? campaign.starts_at
    const nextEndsAt = ends_at !== undefined ? ends_at : campaign.ends_at

    if (nextEndsAt && nextEndsAt <= nextStartsAt) {
      throw new BadRequestError("The end date must be after the start date")
    }

    // O slug nunca é regerado: link já divulgado não pode quebrar por causa de um ajuste de título.
    await campaign.update({
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(goal_amount !== undefined ? { goal_amount } : {}),
      ...(starts_at !== undefined ? { starts_at } : {}),
      ...(ends_at !== undefined ? { ends_at } : {}),
    })

    return campaign.get({ plain: true })
  }
}
