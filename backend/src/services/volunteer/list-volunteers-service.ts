import { QueryTypes } from "sequelize";
import { sequelize } from "../../config/sequelize.js";
import { User } from "../../models/user-model.js";
import { Volunteer } from "../../models/volunteer-model.js";
import type { VolunteerStatus } from "../../models/volunteer-model.js";

interface ListVolunteersProps {
  status: VolunteerStatus | null,
  page: number,
  limit: number,
}

type HoursRow = { volunteer_id: string, hours: string }

// Os cadastros de voluntariado para a coordenação analisar e acompanhar. Cada um traz as horas já
// validadas, somadas pelo banco numa consulta só para a página inteira.
export class ListVolunteersService {
  async execute({ status, page, limit }: ListVolunteersProps) {

    const { rows, count: total } = await Volunteer.findAndCountAll({
      where: status ? { status } : {},
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        { model: User, as: "reviewer", attributes: ["id", "name"] },
      ],
      order: [["created_at", "DESC"], ["id", "ASC"]],
      limit,
      offset: (page - 1) * limit,
    })

    const pending = await Volunteer.count({ where: { status: "pending" } })

    const ids = rows.map((row) => row.id)
    const hours = ids.length > 0
      ? await sequelize.query<HoursRow>(
        `SELECT volunteer_id, SUM(hours) AS hours
           FROM volunteer_assignments
          WHERE volunteer_id IN (:ids) AND status = 'attended'
          GROUP BY volunteer_id`,
        { type: QueryTypes.SELECT, replacements: { ids } }
      )
      : []

    const hoursById = new Map(hours.map((row) => [row.volunteer_id, row.hours]))

    return {
      volunteers: rows.map((row) => ({ ...row.get({ plain: true }), hours_total: hoursById.get(row.id) ?? "0.00" })),
      total,
      pending,
    }
  }
}
