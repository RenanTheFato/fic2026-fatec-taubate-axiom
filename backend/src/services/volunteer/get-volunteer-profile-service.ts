import { QueryTypes } from "sequelize";
import { NotFoundError } from "../../config/errors.js";
import { sequelize } from "../../config/sequelize.js";
import { User } from "../../models/user-model.js";
import { Volunteer } from "../../models/volunteer-model.js";

type HoursRow = { total: string | null, this_month: string | null }

type UpcomingRow = { upcoming: number }

// O cadastro de quem está no painel do voluntariado, com os números que a tela mostra. As horas
// são só as validadas pela coordenação na lista de presença: turno marcado não é turno feito.
export class GetVolunteerProfileService {
  async execute({ user_id }: { user_id: string }) {

    const volunteer = await Volunteer.findOne({
      where: { user_id },
      include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
    })

    if (!volunteer) {
      throw new NotFoundError("Volunteer Not Found")
    }

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [hours, upcoming] = await Promise.all([
      sequelize.query<HoursRow>(
        `SELECT SUM(assignment.hours) AS total,
                SUM(CASE WHEN shift.starts_at >= :month THEN assignment.hours ELSE 0 END) AS this_month
           FROM volunteer_assignments assignment
           JOIN volunteer_shifts shift ON shift.id = assignment.shift_id
          WHERE assignment.volunteer_id = :volunteer AND assignment.status = 'attended'`,
        { type: QueryTypes.SELECT, replacements: { volunteer: volunteer.id, month: monthStart } }
      ),
      sequelize.query<UpcomingRow>(
        `SELECT COUNT(*) AS upcoming
           FROM volunteer_assignments assignment
           JOIN volunteer_shifts shift ON shift.id = assignment.shift_id
          WHERE assignment.volunteer_id = :volunteer
            AND assignment.status IN ('pending', 'confirmed')
            AND shift.status = 'open'
            AND shift.starts_at > :now`,
        { type: QueryTypes.SELECT, replacements: { volunteer: volunteer.id, now } }
      ),
    ])

    const plain = volunteer.get({ plain: true })

    return {
      ...plain,
      summary: {
        hours_total: hours[0]?.total ?? "0.00",
        hours_this_month: hours[0]?.this_month ?? "0.00",
        upcoming_shifts: Number(upcoming[0]?.upcoming ?? 0),
        // A entrada no programa é a aprovação, e não o dia em que o formulário chegou.
        member_since: plain.status === "approved" ? plain.reviewed_at ?? plain.created_at : null,
      },
    }
  }
}
