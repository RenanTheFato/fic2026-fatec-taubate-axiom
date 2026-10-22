import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { RecordVolunteerAttendanceService } from "../../services/volunteer-shift/record-volunteer-attendance-service.js";
import { hasAtMostTwoDecimals } from "../../utils/money.js";

export class RecordVolunteerAttendanceController {
  async handle(req: Request, res: Response) {
    const assignmentParams = z.object({
      id: z.uuid({ error: "The id must be a valid uuid" }),
    })

    // As horas são opcionais: sem elas vale a duração do turno. A coordenação informa quando a
    // pessoa chegou depois ou saiu antes.
    const attendanceValidate = z.object({
      attended: z.boolean({ error: "The attended flag must be a boolean" }),
      hours: z.number({ error: "The hours must be a number" })
        .positive({ error: "The hours must be greater than zero" })
        .max(24, { error: "The hours have exceeded the maximum allowed (24)" })
        .refine(hasAtMostTwoDecimals, { error: "The hours must have at most two decimal places" })
        .transform((hours) => hours.toFixed(2))
        .nullish()
        .default(null),
    })

    const parsedParams = assignmentParams.safeParse(req.params)
    const parsedAttendance = attendanceValidate.safeParse(req.body)

    if (!parsedParams.success || !parsedAttendance.success) {
      const issues = [...(parsedParams.error?.issues ?? []), ...(parsedAttendance.error?.issues ?? [])]
      const errors = issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { id } = parsedParams.data
    const { attended, hours } = parsedAttendance.data

    try {
      const recordVolunteerAttendanceService = new RecordVolunteerAttendanceService()
      const assignment = await recordVolunteerAttendanceService.execute({ id, attended, hours, checked_by: req.user?.id ?? null })

      return res.status(200).json({ message: "Attendance Recorded Successfully", assignment })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
