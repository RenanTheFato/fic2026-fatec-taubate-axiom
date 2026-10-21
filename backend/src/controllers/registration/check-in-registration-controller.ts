import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { CheckInRegistrationService } from "../../services/registration/check-in-registration-service.js";

export class CheckInRegistrationController {
  async handle(req: Request, res: Response) {
    const checkInParams = z.object({
      code: z.string({ error: "The code must be a string" })
        .trim()
        .min(10, { error: "The code doesn't meet the minimum number of characters (10)." })
        .max(16, { error: "The code has exceeded the character limit (16)." }),
    })

    const checkInValidate = z.object({
      event_id: z.uuid({ error: "The event id isn't a valid uuid." }),
    })

    const parsedParams = checkInParams.safeParse(req.params)
    const parsedBody = checkInValidate.safeParse(req.body)

    if (!parsedParams.success || !parsedBody.success) {
      const issues = [
        ...(parsedParams.success ? [] : parsedParams.error.issues),
        ...(parsedBody.success ? [] : parsedBody.error.issues),
      ]
      const errors = issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { code } = parsedParams.data
    const { event_id } = parsedBody.data

    try {
      const checkInRegistrationService = new CheckInRegistrationService()
      const registration = await checkInRegistrationService.execute({ code, event_id, checked_in_by: req.user?.id ?? null })

      return res.status(200).json({ message: "Check-in Registered Successfully", registration })
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
