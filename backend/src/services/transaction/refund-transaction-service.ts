import { literal } from "sequelize";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { StripeGateway } from "../../config/stripe.js";
import { sequelize } from "../../config/sequelize.js";
import { TransactionInterface } from "../../interfaces/transaction-interface.js";
import { TransactionAuditLogInterface } from "../../interfaces/transaction-audit-log-interface.js";
import { Campaign } from "../../models/campaign-model.js";
import { Event } from "../../models/event-model.js";
import { Transaction } from "../../models/transaction-model.js";
import { TransactionAuditLog } from "../../models/transaction-audit-log-model.js";

interface RefundTransactionProps {
  transaction_id: TransactionInterface['id'],
  source: TransactionAuditLogInterface['source'],
  performed_by: TransactionAuditLogInterface['performed_by'],
  reason: TransactionAuditLogInterface['reason'],
  refund_on_gateway?: boolean,
}

export class RefundTransactionService {
  async execute({ transaction_id, source, performed_by, reason, refund_on_gateway = true }: RefundTransactionProps) {

    const transaction = await Transaction.findByPk(transaction_id)

    if (!transaction) {
      throw new NotFoundError("Transaction Not Found")
    }

    if (transaction.status !== "confirmed") {
      throw new BadRequestError("Only a confirmed transaction can be refunded")
    }

    // O estorno no gateway acontece antes da escrita: se ele falhar, nada mudou no nosso banco.
    // O inverso deixaria a transação marcada como estornada com o dinheiro ainda no Stripe.
    // A chamada fica fora da transação de banco de propósito — rede não segura trava de linha.
    if (refund_on_gateway && transaction.gateway_payment_id) {
      await new StripeGateway().refundPayment(transaction.gateway_payment_id)
    }

    //o estorno reverte os efeitos, nunca apaga a transação original.
    return await sequelize.transaction(async (t) => {
      const locked = await Transaction.findByPk(transaction_id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      })

      if (!locked || locked.status !== "confirmed") {
        throw new BadRequestError("Only a confirmed transaction can be refunded")
      }

      if (locked.campaign_id) {
        await Campaign.decrement(
          { raised_amount: Number(locked.amount) },
          { where: { id: locked.campaign_id }, transaction: t }
        )
      }

      // A vaga volta para o evento. O GREATEST evita que um estorno duplicado leve taken_seats
      // a um número negativo, que a coluna UNSIGNED recusaria com erro de banco.
      if (locked.type === "ticket" && locked.event_id) {
        await Event.update(
          { taken_seats: literal("GREATEST(taken_seats - 1, 0)") },
          { where: { id: locked.event_id }, transaction: t }
        )
      }

      await locked.update({
        status: "refunded",
        refunded_at: new Date(),
      }, { transaction: t })

      await TransactionAuditLog.create({
        transaction_id,
        previous_status: "confirmed",
        new_status: "refunded",
        source,
        performed_by,
        reason,
      }, { transaction: t })

      return locked.get({ plain: true })
    })
  }
}
