import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { EventInterface } from "../../interfaces/event-interface.js";
import { Campaign } from "../../models/campaign-model.js";
import { Event } from "../../models/event-model.js";

interface UpdateEventProps {
  event_id: EventInterface['id'],
  campaign_id?: EventInterface['campaign_id'],
  title?: EventInterface['title'],
  description?: EventInterface['description'],
  location?: EventInterface['location'],
  starts_at?: EventInterface['starts_at'],
  ends_at?: EventInterface['ends_at'],
  ticket_price?: EventInterface['ticket_price'],
}

export class UpdateEventService {
  async execute({ event_id, campaign_id, title, description, location, starts_at, ends_at, ticket_price }: UpdateEventProps) {

    const event = await Event.findOne({
      where: {
        id: event_id
      }
    })

    if (!event) {
      throw new NotFoundError("Event Not Found")
    }

    if (event.status === "finished" || event.status === "cancelled") {
      throw new BadRequestError("Cannot be possible to update an event with status finished or cancelled")
    }

    if (campaign_id !== undefined && campaign_id !== null) {
      const campaign = await Campaign.findByPk(campaign_id)

      if (!campaign) {
        throw new BadRequestError("The informed campaign doesn't exist")
      }

      if (campaign.status === "cancelled") {
        throw new BadRequestError("A cancelled campaign can't receive new events")
      }
    }

    // As datas são validadas contra o que vai ficar gravado, não só contra o que veio no corpo,
    // senão mudar só o início conseguiria deixar o evento terminando antes de começar.
    const nextStartsAt = starts_at ?? event.starts_at
    const nextEndsAt = ends_at !== undefined ? ends_at : event.ends_at

    if (nextEndsAt && nextEndsAt <= nextStartsAt) {
      throw new BadRequestError("The end date must be after the start date")
    }

    // O slug nunca é regerado: link já divulgado não pode quebrar por causa de um ajuste de título.
    await event.update({
      ...(campaign_id !== undefined ? { campaign_id } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(starts_at !== undefined ? { starts_at } : {}),
      ...(ends_at !== undefined ? { ends_at } : {}),
      ...(ticket_price !== undefined ? { ticket_price } : {}),
    })

    return event.get({ plain: true })
  }
}
