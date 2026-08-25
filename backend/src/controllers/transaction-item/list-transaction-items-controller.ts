import { Request, Response } from "express";
import { z } from "zod/v4";
import { ListTransactionItemsService } from "../../services/transaction-item/list-transaction-items-service.js";

export class ListTransactionItemsController {
  async handle(req: Request, res: Response) {

    const itemsQuery = z.object({
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
      transaction_id: z.uuid({ error: "The transaction id must be a valid uuid" })
        .optional(),
      product_id: z.uuid({ error: "The product id must be a valid uuid" })
        .optional(),
      from: z.coerce.date({ error: "The from date must be a valid date" })
        .optional(),
      to: z.coerce.date({ error: "The to date must be a valid date" })
        .optional(),
    })

    const parsedItemsQuery = itemsQuery.safeParse(req.query)

    if (!parsedItemsQuery.success) {
      const errors = parsedItemsQuery.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { page, limit, transaction_id, product_id, from, to } = parsedItemsQuery.data

    try {
      const listTransactionItemsService = new ListTransactionItemsService()
      const { items, total } = await listTransactionItemsService.execute({ page, limit, transaction_id, product_id, from, to })

      return res.status(200).json({ message: "Transaction Items Fetched Successfully", items, total })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
