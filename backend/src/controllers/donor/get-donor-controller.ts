import { Request, Response } from "express";
import { z } from "zod/v4";
import { GetDonorService } from "../../services/donor/get-donor-service.js";
import { NotFoundError } from "../../config/errors.js";

export class GetDonorController {
  async handle(req: Request, res: Response) {
    const getDonorParam = z.object({
      id: z.string({ error: "The id must be an string" })
    })

    const parsedGetDonorParam = getDonorParam.safeParse(req.params)

    if (!parsedGetDonorParam.success) {
      const errors = parsedGetDonorParam.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { id } = parsedGetDonorParam.data

    try {
      const getDonorService = new GetDonorService()
      const donor = await getDonorService.execute({ id })

      return res.status(200).json({ message: "Donor Fetched", donor })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}