import { Op } from "sequelize";
import { ForbiddenError, NotFoundError } from "../../config/errors.js";
import { VolunteerAssignment } from "../../models/volunteer-assignment-model.js";
import { VolunteerShift } from "../../models/volunteer-shift-model.js";
import { Volunteer } from "../../models/volunteer-model.js";

// Os turnos abertos que o voluntário aprovado pode escolher: os que ainda não começaram, do mais
// próximo para o mais distante, cada um com as vagas livres e a situação da própria pessoa nele.
export class ListOpenVolunteerShiftsService {
  async execute({ user_id }: { user_id: string }) {

    const volunteer = await Volunteer.findOne({ where: { user_id }, attributes: ["id", "status"] })

    if (!volunteer) {
      throw new NotFoundError("Volunteer Not Found")
    }

    if (volunteer.status !== "approved") {
      throw new ForbiddenError("Only an approved volunteer can see the open shifts")
    }

    const shifts = await VolunteerShift.findAll({
      where: { status: "open", starts_at: { [Op.gt]: new Date() } },
      order: [["starts_at", "ASC"], ["id", "ASC"]],
      limit: 30,
    })

    const mine = shifts.length > 0
      ? await VolunteerAssignment.findAll({
        where: { volunteer_id: volunteer.id, shift_id: { [Op.in]: shifts.map((shift) => shift.id) } },
        attributes: ["shift_id", "status"],
      })
      : []

    const statusByShift = new Map(mine.map((assignment) => [assignment.shift_id, assignment.status]))

    return shifts.map((shift) => {
      const status = statusByShift.get(shift.id)

      return {
        ...shift.get({ plain: true }),
        free_slots: Math.max(shift.slots - shift.taken_slots, 0),
        // Quem saiu do turno volta a vê-lo como qualquer outro.
        my_status: status && status !== "cancelled" ? status : null,
      }
    })
  }
}
