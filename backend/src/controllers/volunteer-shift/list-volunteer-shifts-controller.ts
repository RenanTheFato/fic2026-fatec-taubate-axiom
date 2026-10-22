import { Request, Response } from "express";
import { z } from "zod/v4";
import { ListVolunteerShiftsService } from "../../services/volunteer-shift/list-volunteer-shifts-service.js";

export class ListVolunteerShiftsController {
  async handle(req: Request, res: Response) {
    const shiftsQuery = z.object({
      scope: z.enum(["upcoming", "past"], { error: "The scope must be upcoming or past" })
        .optional()
        .default("upcoming"),
    })

    const parsedShiftsQuery = shiftsQuery.safeParse(req.query)

    if (!parsedShiftsQuery.success) {
      const errors = parsedShiftsQuery.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { scope } = parsedShiftsQuery.data

    try {
      const listVolunteerShiftsService = new ListVolunteerShiftsService()
      const shifts = await listVolunteerShiftsService.execute({ scope })

      return res.status(200).json({ message: "Shifts Fetched Successfully", shifts })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
