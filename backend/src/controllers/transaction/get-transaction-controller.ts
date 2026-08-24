import { Request, Response } from "express";
import { NotFoundError } from "../../config/errors.js";
import { GetTransactionService } from "../../services/transaction/get-transaction-service.js";

export class GetTransactionController {
  async handle(req: Request, res: Response) {
    const { id } = req.params as { id: string }

    try {
      const getTransactionService = new GetTransactionService()
      const transaction = await getTransactionService.execute({ id })

      return res.status(200).json({ message: "Transaction Fetched Successfully", transaction })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
