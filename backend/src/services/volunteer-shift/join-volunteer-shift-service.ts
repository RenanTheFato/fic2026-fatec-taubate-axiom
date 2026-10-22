import { literal, Op } from "sequelize";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../config/errors.js";
import { sequelize } from "../../config/sequelize.js";
import { VolunteerAssignment } from "../../models/volunteer-assignment-model.js";
import { VolunteerShift } from "../../models/volunteer-shift-model.js";
import { Volunteer } from "../../models/volunteer-model.js";

// O voluntário entra num turno aberto. A vaga é decidida pelo banco, como a do evento: quem chega
// depois da última vê zero linhas afetadas. A participação nasce aguardando a confirmação da
// coordenação, mas a vaga já é dela.
export class JoinVolunteerShiftService {
  async execute({ shift_id, user_id }: { shift_id: string, user_id: string }) {

    const volunteer = await Volunteer.findOne({ where: { user_id }, attributes: ["id", "status"] })

    if (!volunteer) {
      throw new NotFoundError("Volunteer Not Found")
    }

    if (volunteer.status !== "approved") {
      throw new ForbiddenError("Only an approved volunteer can join a shift")
    }

    return await sequelize.transaction(async (t) => {
      const shift = await VolunteerShift.findByPk(shift_id, { transaction: t, lock: t.LOCK.UPDATE })

      if (!shift || shift.status !== "open") {
        throw new NotFoundError("Shift Not Found")
      }

      if (shift.starts_at.getTime() <= Date.now()) {
        throw new BadRequestError("This shift has already started")
      }

      const existing = await VolunteerAssignment.findOne({
        where: { shift_id, volunteer_id: volunteer.id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      })

      if (existing && existing.status !== "cancelled") {
        throw new BadRequestError("You are already on this shift")
      }

      const [taken] = await VolunteerShift.update(
        { taken_slots: literal("taken_slots + 1") },
        { where: { id: shift_id, [Op.and]: [literal("taken_slots + 1 <= slots")] }, transaction: t }
      )

      if (taken === 0) {
        throw new BadRequestError("The shift has no slots left")
      }

      // Quem saiu e voltou reaproveita a linha: o índice único (turno, voluntário) não deixa nascer
      // uma segunda.
      const assignment = existing
        ? await existing.update({ status: "pending", hours: null, checked_at: null, checked_by: null }, { transaction: t })
        : await VolunteerAssignment.create({ shift_id, volunteer_id: volunteer.id, status: "pending" }, { transaction: t })

      return assignment.get({ plain: true })
    })
  }
}
