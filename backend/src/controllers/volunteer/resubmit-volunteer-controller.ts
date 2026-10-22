import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { UserInterface } from "../../interfaces/user-interface.js";
import { VOLUNTEER_AREAS, VOLUNTEER_PERIODS } from "../../models/volunteer-model.js";
import { ResubmitVolunteerService } from "../../services/volunteer/resubmit-volunteer-service.js";

export class ResubmitVolunteerController {
  async handle(req: Request, res: Response) {
    const resubmitValidate = z.object({
      area: z.enum(VOLUNTEER_AREAS, { error: "The area is not one of the volunteering fronts." }),
      availability: z.array(z.enum(VOLUNTEER_PERIODS, { error: "The period must be manha, tarde, noite or fim-de-semana" }), { error: "The availability must be a list" })
        .min(1, { error: "Choose at least one period." })
        .max(VOLUNTEER_PERIODS.length, { error: "The availability has exceeded the maximum allowed length." })
        .transform((periods) => [...new Set(periods)]),
      about: z.string({ error: "The presentation must be a string" })
        .trim()
        .min(20, { error: "The presentation doesn't meet the minimum number of characters (20)." })
        .max(2000, { error: "The presentation has exceeded the character limit (2000)." }),
    })

    const parsedResubmit = resubmitValidate.safeParse(req.body)

    if (!parsedResubmit.success) {
      const errors = parsedResubmit.error.issues.map((err) => ({
        code: err.code,
        message: err.message,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { area, availability, about } = parsedResubmit.data
    const { id } = req.user as Pick<UserInterface, 'id'>

    try {
      const resubmitVolunteerService = new ResubmitVolunteerService()
      const volunteer = await resubmitVolunteerService.execute({ user_id: id, area, availability, about })

      return res.status(200).json({ message: "Volunteer Registration Sent Again Successfully", volunteer })
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
