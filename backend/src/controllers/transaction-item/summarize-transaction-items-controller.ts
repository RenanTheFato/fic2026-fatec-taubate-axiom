import { Request, Response } from "express";
import { z } from "zod/v4";
import { TRANSACTION_TYPES } from "../../models/transaction-model.js";
import { SummarizeTransactionItemsService } from "../../services/transaction-item/summarize-transaction-items-service.js";

export class SummarizeTransactionItemsController {
  async handle(req: Request, res: Response) {

    const summaryQuery = z.object({
      product_id: z.uuid({ error: "The product id must be a valid uuid" })
        .optional(),
      type: z.enum(TRANSACTION_TYPES, { error: "The type is not a valid transaction type" })
        .optional(),
      from: z.coerce.date({ error: "The from date must be a valid date" })
        .optional(),
      to: z.coerce.date({ error: "The to date must be a valid date" })
        .optional(),
    })

    const parsedSummaryQuery = summaryQuery.safeParse(req.query)

    if (!parsedSummaryQuery.success) {
      const errors = parsedSummaryQuery.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { product_id, type, from, to } = parsedSummaryQuery.data

    try {
      const summarizeTransactionItemsService = new SummarizeTransactionItemsService()
      const { summary, totals } = await summarizeTransactionItemsService.execute({ product_id, type, from, to })

      return res.status(200).json({ message: "Transaction Items Summarized Successfully", summary, totals })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
