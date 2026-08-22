import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError } from "../../config/errors.js";
import { CreateDonorService } from "../../services/donor/create-donor-service.js";

export class CreateDonorController {
  async handle(req: Request, res: Response) {
    const donorValidate = z.object({
      name: z.string()
        .min(2, { error: "The name doesn't meet the minimum number of characters (2)." })
        .max(128, { error: "The name has exceeded the character limit (128)." }),
      email: z.email({ error: "The value has entered isn't a email or the email is invalid." })
        .max(128, { error: "The email has exceeded the character limit (128)." }),
      document: z.string()
        .min(11, { error: "The document doesn't meet the minimum number of characters (11)." })
        .max(18, { error: "The document has exceeded the character limit (18)." })
        .nullish()
        .default(null),
      phone: z.string()
        .min(8, { error: "The phone doesn't meet the minimum number of characters (8)." })
        .max(20, { error: "The phone has exceeded the character limit (20)." })
        .nullish()
        .default(null),
    })

    const parsedDonor = donorValidate.safeParse(req.body)

    if (!parsedDonor.success) {
      const errors = parsedDonor.error.issues.map((err) => ({
        code: err.code,
        message: err.message,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { name, email, document, phone } = parsedDonor.data

    try {
      const createDonorService = new CreateDonorService()
      const { donor, created } = await createDonorService.execute({ name, email, document, phone })

      return res.status(created ? 201 : 200).json({
        message: created ? "Donor Created Successfully" : "Donor Already Registered",
        donor
      })
    } catch (error: unknown) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
