import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError } from "../../config/errors.js";
import { TRANSACTION_TYPES } from "../../models/transaction-model.js";
import { CreateTransactionService } from "../../services/transaction/create-transaction-service.js";

export class CreateTransactionController {
  async handle(req: Request, res: Response) {

    const transactionSchema = z.object({
      type: z.enum(TRANSACTION_TYPES, { error: "The type must be donation, sponsorship, ticket or product" }),
      amount: z.number({ error: "The amount must be a number" })
        .positive({ error: "The amount must be greater than zero" })
        .max(99999999.99, { error: "The amount has exceeded the maximum allowed value" })
        .refine((amount) => Number.isInteger(amount * 100), { error: "The amount must have at most two decimal places" })
        .transform((amount) => amount.toFixed(2)),
      campaign_id: z.uuid({ error: "The campaign id must be a valid uuid" })
        .nullish()
        .default(null),
      event_id: z.uuid({ error: "The event id must be a valid uuid" })
        .nullish()
        .default(null),
      notes: z.string({ error: "The notes must be a string" })
        .trim()
        .max(1000, { error: "The notes have exceeded the maximum length (1000)" })
        .nullish()
        .default(null),
      donor_name: z.string({ error: "The donor name must be a string" })
        .trim()
        .min(3, { error: "The donor name must be at least 3 characters long" })
        .max(128, { error: "The donor name has exceeded the maximum length (128)" }),
      donor_email: z.email({ error: "The donor email must be a valid email" })
        .max(128, { error: "The donor email has exceeded the maximum length (128)" }),
      donor_document: z.string({ error: "The donor document must be a string" })
        .trim()
        .max(18, { error: "The donor document has exceeded the maximum length (18)" })
        .nullish()
        .default(null),
      donor_phone: z.string({ error: "The donor phone must be a string" })
        .trim()
        .max(20, { error: "The donor phone has exceeded the maximum length (20)" })
        .nullish()
        .default(null),
    })

    const parsedTransaction = transactionSchema.safeParse(req.body)

    if (!parsedTransaction.success) {
      const errors = parsedTransaction.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { type, amount, campaign_id, event_id, notes, donor_name, donor_email, donor_document, donor_phone } = parsedTransaction.data

    try {
      const createTransactionService = new CreateTransactionService()
      const transaction = await createTransactionService.execute({
        type,
        amount,
        campaign_id,
        event_id,
        notes,
        donor_name,
        donor_email,
        donor_document,
        donor_phone,
      })

      return res.status(201).json({ message: "Transaction Created Successfully", transaction })
    } catch (error: unknown) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
