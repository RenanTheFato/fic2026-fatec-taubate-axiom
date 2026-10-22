import { Op } from "sequelize";
import { NotFoundError } from "../../config/errors.js";
import { VolunteerAssignment } from "../../models/volunteer-assignment-model.js";
import { VolunteerShift } from "../../models/volunteer-shift-model.js";
import { Volunteer } from "../../models/volunteer-model.js";

// A escala de quem está no painel: os turnos em que entrou, com a situação de cada um. Turno de que
// a pessoa saiu não aparece, e o turno cancelado pela coordenação aparece como cancelado, para ela
// não ir até a casa à toa.
export class ListMyVolunteerShiftsService {
  async execute({ user_id }: { user_id: string }) {

    const volunteer = await Volunteer.findOne({ where: { user_id }, attributes: ["id"] })

    if (!volunteer) {
      throw new NotFoundError("Volunteer Not Found")
    }

    const assignments = await VolunteerAssignment.findAll({
      where: { volunteer_id: volunteer.id, status: { [Op.ne]: "cancelled" } },
      include: [{ model: VolunteerShift, as: "shift" }],
      order: [[{ model: VolunteerShift, as: "shift" }, "starts_at", "DESC"]],
      limit: 100,
    })

    const cancelledShifts = await VolunteerAssignment.findAll({
      where: { volunteer_id: volunteer.id, status: "cancelled" },
      include: [{ model: VolunteerShift, as: "shift", where: { status: "cancelled", starts_at: { [Op.gt]: new Date() } } }],
      limit: 20,
    })

    return [...assignments, ...cancelledShifts].map((row) => row.get({ plain: true }))
  }
}
