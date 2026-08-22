import { BadRequestError } from "../../config/errors.js";
import { EventInterface } from "../../interfaces/event-interface.js";
import { Campaign } from "../../models/campaign-model.js";
import { Event } from "../../models/event-model.js";
import { slugify } from "../../utils/slugify.js";

export class CreateEventService {
  async execute({ campaign_id, title, description, location, starts_at, ends_at, ticket_price, capacity }: Pick<EventInterface, 'campaign_id' | 'title' | 'description' | 'location' | 'starts_at' | 'ends_at' | 'ticket_price' | 'capacity'>) {
    const slug = slugify(title)

    if (!slug) {
      throw new BadRequestError("The title must contain at least one letter or number")
    }

    const verifySlugInUse = await Event.findOne({
      where: {
        slug
      }
    })

    if (verifySlugInUse) {
      throw new BadRequestError("An event with this title already exists")
    }

    if (campaign_id) {
      const campaign = await Campaign.findByPk(campaign_id)

      if (!campaign) {
        throw new BadRequestError("The informed campaign doesn't exist")
      }

      if (campaign.status === "cancelled") {
        throw new BadRequestError("A cancelled campaign can't receive new events")
      }
    }

    const event = await Event.create({
      campaign_id,
      title,
      slug,
      description,
      location,
      starts_at,
      ends_at,
      ticket_price,
      capacity,
      taken_seats: 0,
      status: "draft"
    })

    return event.get({ plain: true })
  }
}
