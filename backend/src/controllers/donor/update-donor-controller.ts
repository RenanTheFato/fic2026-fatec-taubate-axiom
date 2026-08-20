import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { UpdateDonorService } from "../../services/donor/update-donor-service.js";

export class UpdateDonorController {
  async handle(req: Request, res: Response) {
    const { id } = req.params as { id: string }

    const donorValidate = z.object({
      name: z.string()
        .min(2, { error: "The name doesn't meet the minimum number of characters (2)." })
        .max(128, { error: "The name has exceeded the character limit (128)." })
        .optional(),
      email: z.email({ error: "The value has entered isn't a email or the email is invalid." })
        .max(128, { error: "The email has exceeded the character limit (128)." })
        .optional(),
      phone: z.string()
        .min(8, { error: "The phone doesn't meet the minimum number of characters (8)." })
        .max(20, { error: "The phone has exceeded the character limit (20)." })
        .nullish(),
    }).refine((donor) => Object.keys(donor).length > 0, {
      error: "At least one field must be provided to update the donor.",
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

    const { name, email, phone } = parsedDonor.data

    try {
      const updateDonorService = new UpdateDonorService()
      const donor = await updateDonorService.execute({ id, name, email, phone })

      return res.status(200).json({ message: "Donor Updated Successfully", donor })
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
