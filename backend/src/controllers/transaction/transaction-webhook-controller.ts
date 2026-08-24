import { Request, Response } from "express";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { constructWebhookEvent } from "../../config/stripe.js";
import { ProcessTransactionWebhookService } from "../../services/transaction/process-transaction-webhook-service.js";

export class TransactionWebhookController {
  async handle(req: Request, res: Response) {

    // A rota é pública porque quem chama é o Stripe, não um usuário logado. A assinatura é o que
    // faz o papel do token aqui: sem ela, qualquer um que descubra a URL confirma transação. A
    // checagem vem antes de qualquer consulta ao banco, e é ela que também valida o formato do
    // corpo — por isso não há schema Zod nesta rota.
    const event = constructWebhookEvent(
      req.body as Buffer,
      req.headers["stripe-signature"] as string | undefined
    )

    if (!event) {
      return res.status(401).json({ error: "Invalid webhook signature" })
    }

    try {
      const processTransactionWebhookService = new ProcessTransactionWebhookService()
      const result = await processTransactionWebhookService.execute({ event })

      return res.status(200).json({ message: "Webhook Processed Successfully", ...result })
    } catch (error: unknown) {
      // Uma transação desconhecida não pode devolver erro: o Stripe reenviaria a mesma
      // notificação por dias. O log fica para a rotina de reconciliação.
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        console.error(error)
        return res.status(200).json({ message: "Webhook Received", processed: false, reason: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
