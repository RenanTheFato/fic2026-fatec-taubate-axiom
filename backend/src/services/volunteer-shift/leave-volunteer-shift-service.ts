import { literal } from "sequelize";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { sequelize } from "../../config/sequelize.js";
import { VolunteerAssignment } from "../../models/volunteer-assignment-model.js";
import { VolunteerShift } from "../../models/volunteer-shift-model.js";
import { Volunteer } from "../../models/volunteer-model.js";

// O voluntário sai de um turno que ainda não começou, e a vaga volta para a escala. Depois do
// início, quem resolve é a coordenação, na lista de presença.
export class LeaveVolunteerShiftService {
  async execute({ shift_id, user_id }: { shift_id: string, user_id: string }) {

    const volunteer = await Volunteer.findOne({ where: { user_id }, attributes: ["id"] })

    if (!volunteer) {
      throw new NotFoundError("Volunteer Not Found")
    }

    return await sequelize.transaction(async (t) => {
      const shift = await VolunteerShift.findByPk(shift_id, { transaction: t, lock: t.LOCK.UPDATE })
      const assignment = shift
        ? await VolunteerAssignment.findOne({ where: { shift_id, volunteer_id: volunteer.id }, transaction: t, lock: t.LOCK.UPDATE })
        : null

      if (!shift || !assignment || assignment.status === "cancelled") {
        throw new NotFoundError("You are not on this shift")
      }

      if (assignment.status !== "pending" && assignment.status !== "confirmed") {
        throw new BadRequestError("The attendance of this shift has already been recorded")
      }

      if (shift.starts_at.getTime() <= Date.now()) {
        throw new BadRequestError("This shift has already started")
      }

      await assignment.update({ status: "cancelled" }, { transaction: t })

      // O GREATEST protege a coluna UNSIGNED, como na inscrição do evento.
      await VolunteerShift.update(
        { taken_slots: literal("GREATEST(taken_slots - 1, 0)") },
        { where: { id: shift_id }, transaction: t }
      )

      return assignment.get({ plain: true })
    })
  }
}
