import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { CreateRegistrationService } from "../../services/registration/create-registration-service.js";

export class CreateRegistrationController {
  async handle(req: Request, res: Response) {
    const registrationValidate = z.object({
      event_id: z.uuid({ error: "The event id isn't a valid uuid." }),
      participant_name: z.string({ error: "The name must be a string" })
        .trim()
        .min(3, { error: "The name doesn't meet the minimum number of characters (3)." })
        .max(128, { error: "The name has exceeded the character limit (128)." }),
      participant_email: z.email({ error: "The value has entered isn't a email or the email is invalid." })
        .max(128, { error: "The email has exceeded the character limit (128)." }),
      participant_phone: z.string({ error: "The phone must be a string" })
        .trim()
        .min(8, { error: "The phone doesn't meet the minimum number of characters (8)." })
        .max(20, { error: "The phone has exceeded the character limit (20)." })
        .nullish()
        .default(null),
    })

    const parsedRegistration = registrationValidate.safeParse(req.body)

    if (!parsedRegistration.success) {
      const errors = parsedRegistration.error.issues.map((err) => ({
        code: err.code,
        message: err.message,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { event_id, participant_name, participant_email, participant_phone } = parsedRegistration.data

    try {
      const createRegistrationService = new CreateRegistrationService()
      const registration = await createRegistrationService.execute({ event_id, participant_name, participant_email, participant_phone })

      return res.status(201).json({ message: "Registration Created Successfully", registration })
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
