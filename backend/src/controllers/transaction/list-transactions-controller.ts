import { Request, Response } from "express";
import { z } from "zod/v4";
import { TRANSACTION_STATUSES, TRANSACTION_TYPES } from "../../models/transaction-model.js";
import { ListTransactionsService } from "../../services/transaction/list-transactions-service.js";

export class ListTransactionsController {
  async handle(req: Request, res: Response) {

    const transactionsQuery = z.object({
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
      status: z.enum(TRANSACTION_STATUSES, { error: "The status is not a valid transaction status" })
        .optional(),
      type: z.enum(TRANSACTION_TYPES, { error: "The type is not a valid transaction type" })
        .optional(),
      campaign_id: z.uuid({ error: "The campaign id must be a valid uuid" })
        .optional(),
      event_id: z.uuid({ error: "The event id must be a valid uuid" })
        .optional(),
      donor_id: z.uuid({ error: "The donor id must be a valid uuid" })
        .optional(),
      from: z.coerce.date({ error: "The from date must be a valid date" })
        .optional(),
      to: z.coerce.date({ error: "The to date must be a valid date" })
        .optional(),
    })

    const parsedTransactionsQuery = transactionsQuery.safeParse(req.query)

    if (!parsedTransactionsQuery.success) {
      const errors = parsedTransactionsQuery.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { page, limit, status, type, campaign_id, event_id, donor_id, from, to } = parsedTransactionsQuery.data

    try {
      const listTransactionsService = new ListTransactionsService()
      const { transactions, total } = await listTransactionsService.execute({
        page,
        limit,
        status,
        type,
        campaign_id,
        event_id,
        donor_id,
        from,
        to,
      })

      return res.status(200).json({ message: "Transactions Fetched Successfully", transactions, total })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
