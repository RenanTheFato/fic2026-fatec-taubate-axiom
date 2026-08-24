import Stripe from "stripe";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { sequelize } from "../../config/sequelize.js";
import { StripeGateway } from "../../config/stripe.js";
import { Transaction } from "../../models/transaction-model.js";
import { TransactionAuditLog } from "../../models/transaction-audit-log-model.js";
import { TransactionStatus } from "../../models/transaction-model.js";
import { CancelTransactionService } from "./cancel-transaction-service.js";
import { ConfirmTransactionService } from "./confirm-transaction-service.js";
import { RefundTransactionService } from "./refund-transaction-service.js";
import { RefuseTransactionService } from "./refuse-transaction-service.js";

interface ProcessTransactionWebhookProps {
  event: Stripe.Event,
}

interface EventOutcome {
  status: TransactionStatus,
  transaction_id: string | null,
  payment_intent_id: string | null,
  // Falha e expiração precisam vir do evento: nos dois casos o PaymentIntent volta a
  // requires_payment_method e deixa de distinguir um pagamento recusado de um nunca tentado.
  status_comes_from_event: boolean,
}

export class ProcessTransactionWebhookService {
  async execute({ event }: ProcessTransactionWebhookProps) {

    // O Stripe manda dezenas de tipos de evento no mesmo endpoint. O que não descreve uma
    // mudança de estado de pagamento é ignorado com sucesso: responder erro faria o gateway
    // reenviar a mesma notificação por dias.
    const outcome = this.readEvent(event)

    if (!outcome) {
      return { processed: false, reason: `Event type ${event.type} is not handled` }
    }

    // o efeito financeiro não sai do corpo da notificação. A assinatura garante que
    // o corpo veio do Stripe, não que ele ainda seja o estado atual — uma reentrega atrasada
    // descreve um pagamento que já mudou desde então.
    const payment = outcome.payment_intent_id
      ? await new StripeGateway().getPayment(outcome.payment_intent_id)
      : null

    const transaction_id = outcome.transaction_id ?? payment?.transaction_id ?? null

    if (!transaction_id) {
      throw new BadRequestError("The payment has no reference to a transaction")
    }

    const transaction = await Transaction.findByPk(transaction_id)

    if (!transaction) {
      throw new NotFoundError("Transaction Not Found")
    }

    const status = payment && !outcome.status_comes_from_event ? payment.status : outcome.status

    // O Stripe reenvia o mesmo evento várias vezes. Chegar num status que a transação já tem
    // não é erro, é a reentrega — e reprocessar somaria arrecadação duas vezes.
    if (transaction.status === status) {
      return { processed: false, reason: "Transaction is already in this status" }
    }

    const common = {
      transaction_id: transaction.id,
      source: "webhook" as const,
      performed_by: null,
      reason: `Stripe event ${event.id} (${event.type})`,
    }

    switch (status) {
      case "confirmed":
        await new ConfirmTransactionService().execute({
          ...common,
          payment_method: payment?.payment_method ?? undefined,
          gateway_payment_id: outcome.payment_intent_id ?? undefined,
        })
        break

      case "refused":
        await new RefuseTransactionService().execute(common)
        break

      case "cancelled":
        await new CancelTransactionService().execute(common)
        break

      case "refunded":
        // O dinheiro já voltou pelo lado do Stripe: pedir o estorno de novo seria erro.
        await new RefundTransactionService().execute({ ...common, refund_on_gateway: false })
        break

      default:
        await this.recordPendingStatus(transaction, status, payment?.payment_method ?? undefined, outcome.payment_intent_id ?? undefined, common.reason)
    }

    return { processed: true, status }
  }

  // Traduz o evento para o desfecho que ele descreve. Devolver null é a resposta certa para
  // todo evento que não muda o estado de um pagamento nosso.
  private readEvent(event: Stripe.Event): EventOutcome | null {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object

        return {
          // Pix e boleto fecham a sessão antes de o dinheiro cair: aí o pagamento ainda está
          // em trânsito e a vaga do evento não pode ser debitada.
          status: session.payment_status === "unpaid" ? "awaiting_confirmation" : "confirmed",
          transaction_id: session.client_reference_id,
          payment_intent_id: this.readId(session.payment_intent),
          status_comes_from_event: false,
        }
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object

        return {
          status: "refused",
          transaction_id: session.client_reference_id,
          payment_intent_id: this.readId(session.payment_intent),
          status_comes_from_event: true,
        }
      }

      case "checkout.session.expired": {
        const session = event.data.object

        return {
          status: "cancelled",
          transaction_id: session.client_reference_id,
          payment_intent_id: null,
          status_comes_from_event: true,
        }
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object

        return {
          status: "refused",
          transaction_id: intent.metadata?.transaction_id ?? null,
          payment_intent_id: intent.id,
          status_comes_from_event: true,
        }
      }

      case "charge.refunded": {
        const charge = event.data.object

        return {
          status: "refunded",
          transaction_id: null,
          payment_intent_id: this.readId(charge.payment_intent),
          status_comes_from_event: false,
        }
      }

      default:
        return null
    }
  }

  // Um campo de referência do Stripe vem como id ou como o objeto inteiro já expandido.
  private readId(reference: string | { id: string } | null | undefined) {
    if (!reference) {
      return null
    }

    return typeof reference === "string" ? reference : reference.id
  }

  // pending e awaiting_confirmation não têm efeito financeiro: só carimbam o status e o log.
  private async recordPendingStatus(
    transaction: Transaction,
    status: TransactionStatus,
    payment_method: Transaction['payment_method'] | undefined,
    gateway_payment_id: string | undefined,
    reason: string
  ) {
    await sequelize.transaction(async (t) => {
      const previousStatus = transaction.status

      await transaction.update({
        status,
        ...(payment_method !== undefined ? { payment_method } : {}),
        ...(gateway_payment_id !== undefined ? { gateway_payment_id } : {}),
      }, { transaction: t })

      await TransactionAuditLog.create({
        transaction_id: transaction.id,
        previous_status: previousStatus,
        new_status: status,
        source: "webhook",
        performed_by: null,
        reason,
      }, { transaction: t })
    })
  }
}
