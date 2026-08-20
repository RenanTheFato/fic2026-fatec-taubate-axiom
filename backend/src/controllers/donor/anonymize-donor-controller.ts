import { Request, Response } from "express";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { AnonymizeDonorService } from "../../services/donor/anonymize-donor-service.js";

export class AnonymizeDonorController {
  async handle(req: Request, res: Response) {
    const { id } = req.params as { id: string }

    try {
      const anonymizeDonorService = new AnonymizeDonorService()
      const donor = await anonymizeDonorService.execute({ id })

      return res.status(200).json({ message: "Donor Anonymized Successfully", donor })
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
