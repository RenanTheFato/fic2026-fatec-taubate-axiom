import { Op } from "sequelize";
import { User } from "../../models/user-model.js";
import { VolunteerAssignment } from "../../models/volunteer-assignment-model.js";
import { VolunteerShift } from "../../models/volunteer-shift-model.js";
import { Volunteer } from "../../models/volunteer-model.js";

export type ShiftScope = "upcoming" | "past"

// A escala para a coordenação. "upcoming" são os turnos que ainda não terminaram, do mais próximo
// para o mais distante; "past", os que já terminaram, do mais recente para trás, que é onde a
// presença é fechada. Cada turno vem com quem se ofereceu, mesmo quem saiu, para a coordenação
// entender a lista.
export class ListVolunteerShiftsService {
  async execute({ scope }: { scope: ShiftScope }) {
    const now = new Date()

    const shifts = await VolunteerShift.findAll({
      where: scope === "upcoming" ? { ends_at: { [Op.gte]: now } } : { ends_at: { [Op.lt]: now } },
      include: [{
        model: VolunteerAssignment,
        as: "assignments",
        required: false,
        include: [{
          model: Volunteer,
          as: "volunteer",
          attributes: ["id", "phone", "area"],
          include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
        }],
      }],
      order: [
        ["starts_at", scope === "upcoming" ? "ASC" : "DESC"],
        ["id", "ASC"],
        [{ model: VolunteerAssignment, as: "assignments" }, "created_at", "ASC"],
      ],
      limit: 40,
    })

    return shifts.map((shift) => shift.get({ plain: true }))
  }
}
