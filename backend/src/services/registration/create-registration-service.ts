import { literal, Op } from "sequelize";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { sequelize } from "../../config/sequelize.js";
import { RegistrationInterface } from "../../interfaces/registration-interface.js";
import { Event } from "../../models/event-model.js";
import { Registration } from "../../models/registration-model.js";
import { formatTicketCode, generateTicketCode } from "../../utils/ticket-code.js";

type CreateRegistrationProps = Pick<RegistrationInterface, 'event_id' | 'participant_name' | 'participant_email' | 'participant_phone'>

// A inscrição no evento gratuito. O convite pago não passa por aqui: a inscrição dele nasce na
// confirmação do pagamento, porque antes disso a vaga não é de ninguém.
export class CreateRegistrationService {
  async execute({ event_id, participant_name, participant_email, participant_phone }: CreateRegistrationProps) {

    return await sequelize.transaction(async (t) => {
      // A trava na linha do evento enfileira as inscrições simultâneas do mesmo evento, então a
      // checagem de inscrição repetida logo abaixo não corre contra outra igual.
      const event = await Event.findByPk(event_id, { transaction: t, lock: t.LOCK.UPDATE })

      // Rascunho e cancelado respondem como inexistentes, como na página pública do evento.
      if (!event || event.status === "draft" || event.status === "cancelled") {
        throw new NotFoundError("Event Not Found")
      }

      const ends = event.ends_at ?? event.starts_at

      if (event.status !== "published" || ends.getTime() < Date.now()) {
        throw new BadRequestError("Registrations for this event are closed")
      }

      if (Number(event.ticket_price) > 0) {
        throw new BadRequestError("This event has a paid ticket: the registration comes with the purchase")
      }

      const repeated = await Registration.findOne({
        where: { event_id, participant_name, participant_email, status: "confirmed" },
        attributes: ["id"],
        transaction: t,
      })

      if (repeated) {
        throw new BadRequestError("There is already a registration with this name and e-mail for this event")
      }

      // A vaga é decidida pelo banco, como na confirmação do convite pago: quem chega depois da
      // última vê zero linhas afetadas.
      const [taken] = await Event.update(
        { taken_seats: literal("taken_seats + 1") },
        {
          where: {
            id: event_id,
            [Op.or]: [
              { capacity: null },
              literal("taken_seats + 1 <= capacity"),
            ],
          },
          transaction: t,
        }
      )

      if (taken === 0) {
        throw new BadRequestError("The event has no seats left")
      }

      const registration = await Registration.create({
        event_id,
        transaction_id: null,
        ticket_code: generateTicketCode(),
        participant_name,
        participant_email,
        participant_phone,
        status: "confirmed",
      }, { transaction: t })

      return {
        id: registration.id,
        ticket_code: formatTicketCode(registration.ticket_code),
        participant_name: registration.participant_name,
        status: registration.status,
        event: { title: event.title, slug: event.slug, starts_at: event.starts_at },
      }
    })
  }
}
