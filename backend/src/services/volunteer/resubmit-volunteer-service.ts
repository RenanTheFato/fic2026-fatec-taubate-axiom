import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { VolunteerInterface } from "../../interfaces/volunteer-interface.js";
import { Volunteer } from "../../models/volunteer-model.js";

type ResubmitVolunteerProps = { user_id: string } & Pick<VolunteerInterface, 'area' | 'availability' | 'about'>

// Quem teve o cadastro recusado ajusta área, períodos e apresentação e manda de novo pelo painel,
// com a mesma conta. O cadastro volta para a fila da coordenação.
export class ResubmitVolunteerService {
  async execute({ user_id, area, availability, about }: ResubmitVolunteerProps) {

    const volunteer = await Volunteer.findOne({ where: { user_id } })

    if (!volunteer) {
      throw new NotFoundError("Volunteer Not Found")
    }

    if (volunteer.status !== "refused") {
      throw new BadRequestError("Only a refused registration can be sent again")
    }

    await volunteer.update({
      area,
      availability,
      about,
      status: "pending",
      review_note: null,
      reviewed_at: null,
      reviewed_by: null,
    })

    return volunteer.get({ plain: true })
  }
}
