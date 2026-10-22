import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { VolunteerAssignment } from "../../models/volunteer-assignment-model.js";
import { VolunteerShift } from "../../models/volunteer-shift-model.js";
import { fromCents } from "../../utils/money.js";

interface RecordVolunteerAttendanceProps {
  id: string,
  attended: boolean,
  hours: string | null,
  checked_by: string | null,
}

// A presença fechada pela coordenação depois que o turno começa. É ela que vira hora no painel do
// voluntário: sem as horas informadas, vale a duração do turno. Pode ser corrigida, porque quem
// marca falta por engano precisa conseguir desfazer.
export class RecordVolunteerAttendanceService {
  async execute({ id, attended, hours, checked_by }: RecordVolunteerAttendanceProps) {

    const assignment = await VolunteerAssignment.findByPk(id)
    const shift = assignment ? await VolunteerShift.findByPk(assignment.shift_id) : null

    if (!assignment || !shift) {
      throw new NotFoundError("Assignment Not Found")
    }

    if (assignment.status === "cancelled") {
      throw new BadRequestError("This volunteer left the shift before it happened")
    }

    if (shift.starts_at.getTime() > Date.now()) {
      throw new BadRequestError("The attendance is recorded after the shift starts")
    }

    // A duração em centavos de hora inteiros, pela mesma razão do dinheiro: 2,5 h tem que ser
    // "2.50", e não 2.4999999.
    const duration = fromCents(Math.round((shift.ends_at.getTime() - shift.starts_at.getTime()) / 36_000))

    await assignment.update({
      status: attended ? "attended" : "absent",
      hours: attended ? hours ?? duration : null,
      checked_at: new Date(),
      checked_by,
    })

    return assignment.get({ plain: true })
  }
}
