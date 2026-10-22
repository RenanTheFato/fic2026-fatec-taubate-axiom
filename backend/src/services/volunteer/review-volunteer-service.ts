import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { VolunteerInterface } from "../../interfaces/volunteer-interface.js";
import { Volunteer } from "../../models/volunteer-model.js";

interface ReviewVolunteerProps {
  id: VolunteerInterface['id'],
  decision: "approved" | "refused",
  note: VolunteerInterface['review_note'],
  reviewed_by: VolunteerInterface['reviewed_by'],
}

// A decisão da coordenação sobre o cadastro. Aprovado, a pessoa passa a ver e a escolher os turnos
// abertos; recusado, ela lê o motivo no painel e pode mandar de novo.
export class ReviewVolunteerService {
  async execute({ id, decision, note, reviewed_by }: ReviewVolunteerProps) {

    const volunteer = await Volunteer.findByPk(id)

    if (!volunteer) {
      throw new NotFoundError("Volunteer Not Found")
    }

    if (volunteer.status !== "pending") {
      throw new BadRequestError("This registration has already been reviewed")
    }

    await volunteer.update({ status: decision, review_note: note, reviewed_at: new Date(), reviewed_by })

    return volunteer.get({ plain: true })
  }
}
