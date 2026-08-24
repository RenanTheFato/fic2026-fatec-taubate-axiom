import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { UserInterface } from "../../interfaces/user-interface.js";
import { RefuseTransactionService } from "../../services/transaction/refuse-transaction-service.js";

export class RefuseTransactionController {
  async handle(req: Request, res: Response) {
    const { id } = req.user as Pick<UserInterface, 'id'>

    const { id: transaction_id } = req.params as { id: string }

    const reasonSchema = z.object({
      reason: z.string({ error: "The reason must be a string" })
        .trim()
        .min(3, { error: "The reason must be at least 3 characters long" })
        .max(255, { error: "The reason has exceeded the maximum length (255)" })
        .nullish()
        .default(null),
    })

    const parsedReason = reasonSchema.safeParse(req.body)

    if (!parsedReason.success) {
      const errors = parsedReason.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { reason } = parsedReason.data

    try {
      const refuseTransactionService = new RefuseTransactionService()
      const transaction = await refuseTransactionService.execute({
        transaction_id,
        source: "manual",
        performed_by: id,
        reason,
      })

      return res.status(200).json({ message: "Transaction Is Now Refused", transaction })
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
