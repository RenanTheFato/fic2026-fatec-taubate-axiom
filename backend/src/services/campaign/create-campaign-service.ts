import { BadRequestError } from "../../config/errors.js";
import { CampaignInterface } from "../../interfaces/campaign-interface.js";
import { Campaign } from "../../models/campaign-model.js";

function slugify(title: string) {
  return title.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export class CreateCampaignService {
  async execute({ title, description, goal_amount, starts_at, ends_at }: Pick<CampaignInterface, 'title' | 'description' | 'goal_amount' | 'starts_at' | 'ends_at'>) {
    const slug = slugify(title)

    if (!slug) {
      throw new BadRequestError("The title must contain at least one letter or number")
    }

    const verifySlugInUse = await Campaign.findOne({
      where: {
        slug
      }
    })

    if (verifySlugInUse) {
      throw new BadRequestError("A campaign with this title already exists")
    }

    const campaign = await Campaign.create({
      title,
      slug,
      description,
      goal_amount,
      starts_at,
      ends_at,
      status: "draft"
    })

    return campaign.get({ plain: true })
  }
}
