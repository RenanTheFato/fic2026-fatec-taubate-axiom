import { Request, Response } from "express";
import { z } from "zod/v4";
import { RECEIPT_STATUSES } from "../../models/receipt-model.js";
import { TRANSACTION_TYPES } from "../../models/transaction-model.js";
import { ListReceiptsService } from "../../services/receipt/list-receipts-service.js";

export class ListReceiptsController {
  async handle(req: Request, res: Response) {

    const receiptsQuery = z.object({
      page: z.coerce.number({ error: "The page must be an number" })
        .int({ error: "The page must be an integer" })
        .positive({ error: "The page number must be greater than zero" })
        .optional()
        .default(1),
      limit: z.coerce.number({ error: "The limit must be an number" })
        .int({ error: "The limit must be an integer" })
        .positive({ error: "The limit must be greater than zero" })
        .max(50, { error: "The limit has exceeded the maximum allowed limit (50)" })
        .optional()
        .default(20),
      status: z.enum(RECEIPT_STATUSES, { error: "The status is not a valid receipt status" })
        .optional(),
      transaction_type: z.enum(TRANSACTION_TYPES, { error: "The transaction type is not a valid transaction type" })
        .optional(),
      from: z.coerce.date({ error: "The from date must be a valid date" })
        .optional(),
      to: z.coerce.date({ error: "The to date must be a valid date" })
        .optional(),
    })

    const parsedReceiptsQuery = receiptsQuery.safeParse(req.query)

    if (!parsedReceiptsQuery.success) {
      const errors = parsedReceiptsQuery.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { page, limit, status, transaction_type, from, to } = parsedReceiptsQuery.data

    try {
      const listReceiptsService = new ListReceiptsService()
      const { receipts, total } = await listReceiptsService.execute({
        page,
        limit,
        status,
        transaction_type,
        from,
        to,
      })

      return res.status(200).json({ message: "Receipts Fetched Successfully", receipts, total })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
