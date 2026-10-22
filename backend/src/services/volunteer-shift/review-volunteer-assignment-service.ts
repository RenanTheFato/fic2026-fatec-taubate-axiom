import { literal } from "sequelize";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { sequelize } from "../../config/sequelize.js";
import { VolunteerAssignment } from "../../models/volunteer-assignment-model.js";
import { VolunteerShift } from "../../models/volunteer-shift-model.js";

interface ReviewVolunteerAssignmentProps {
  id: string,
  decision: "confirmed" | "cancelled",
}

// A coordenação confirma quem se ofereceu para o turno, ou dispensa e devolve a vaga. Vale só antes
// de o turno começar: depois disso o que se registra é presença ou falta.
export class ReviewVolunteerAssignmentService {
  async execute({ id, decision }: ReviewVolunteerAssignmentProps) {

    return await sequelize.transaction(async (t) => {
      const assignment = await VolunteerAssignment.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE })
      const shift = assignment ? await VolunteerShift.findByPk(assignment.shift_id, { transaction: t, lock: t.LOCK.UPDATE }) : null

      if (!assignment || !shift) {
        throw new NotFoundError("Assignment Not Found")
      }

      if (shift.status === "cancelled") {
        throw new BadRequestError("This shift has been cancelled")
      }

      if (shift.starts_at.getTime() <= Date.now()) {
        throw new BadRequestError("This shift has already started: record the attendance instead")
      }

      const allowed = decision === "confirmed" ? ["pending"] : ["pending", "confirmed"]

      if (!allowed.includes(assignment.status)) {
        throw new BadRequestError(decision === "confirmed" ? "Only a pending volunteer can be confirmed" : "This volunteer is no longer on the shift")
      }

      await assignment.update({ status: decision }, { transaction: t })

      if (decision === "cancelled") {
        await VolunteerShift.update(
          { taken_slots: literal("GREATEST(taken_slots - 1, 0)") },
          { where: { id: shift.id }, transaction: t }
        )
      }

      return assignment.get({ plain: true })
    })
  }
}
