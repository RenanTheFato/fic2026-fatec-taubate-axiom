import { Op } from "sequelize";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { sequelize } from "../../config/sequelize.js";
import { VolunteerAssignment } from "../../models/volunteer-assignment-model.js";
import { VolunteerShift } from "../../models/volunteer-shift-model.js";

// Cancela um turno que ainda não aconteceu. Quem estava escalado sai junto, na mesma transação: um
// turno cancelado com gente confirmada mandaria alguém para a porta à toa.
export class CancelVolunteerShiftService {
  async execute({ id }: { id: string }) {

    return await sequelize.transaction(async (t) => {
      const shift = await VolunteerShift.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE })

      if (!shift) {
        throw new NotFoundError("Shift Not Found")
      }

      if (shift.status === "cancelled") {
        throw new BadRequestError("This shift has already been cancelled")
      }

      if (shift.starts_at.getTime() <= Date.now()) {
        throw new BadRequestError("A shift that has already started cannot be cancelled")
      }

      const [released] = await VolunteerAssignment.update(
        { status: "cancelled" },
        { where: { shift_id: id, status: { [Op.in]: ["pending", "confirmed"] } }, transaction: t }
      )

      await shift.update({ status: "cancelled", taken_slots: 0 }, { transaction: t })

      return { ...shift.get({ plain: true }), released }
    })
  }
}
