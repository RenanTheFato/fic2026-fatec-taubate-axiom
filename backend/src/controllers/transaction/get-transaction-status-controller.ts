import { Request, Response } from "express";
import { z } from "zod/v4";
import { NotFoundError } from "../../config/errors.js";
import { GetTransactionStatusService } from "../../services/transaction/get-transaction-status-service.js";

export class GetTransactionStatusController {
  async handle(req: Request, res: Response) {
    const statusParam = z.object({
      id: z.uuid({ error: "The transaction id must be a valid uuid" }),
    })

    const parsedStatusParam = statusParam.safeParse(req.params)

    if (!parsedStatusParam.success) {
      const errors = parsedStatusParam.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { id } = parsedStatusParam.data

    try {
      const getTransactionStatusService = new GetTransactionStatusService()
      const transaction = await getTransactionStatusService.execute({ id })

      return res.status(200).json({ message: "Transaction Status Fetched Successfully", transaction })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
