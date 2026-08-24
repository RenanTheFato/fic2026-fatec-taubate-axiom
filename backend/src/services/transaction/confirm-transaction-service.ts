import { literal, Op } from "sequelize";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { sequelize } from "../../config/sequelize.js";
import { TransactionInterface } from "../../interfaces/transaction-interface.js";
import { TransactionAuditLogInterface } from "../../interfaces/transaction-audit-log-interface.js";
import { Campaign } from "../../models/campaign-model.js";
import { Event } from "../../models/event-model.js";
import { Transaction } from "../../models/transaction-model.js";
import { TransactionAuditLog } from "../../models/transaction-audit-log-model.js";

interface ConfirmTransactionProps {
  transaction_id: TransactionInterface['id'],
  source: TransactionAuditLogInterface['source'],
  performed_by: TransactionAuditLogInterface['performed_by'],
  reason: TransactionAuditLogInterface['reason'],
  payment_method?: TransactionInterface['payment_method'],
  gateway_payment_id?: TransactionInterface['gateway_payment_id'],
}

export class ConfirmTransactionService {
  async execute({ transaction_id, source, performed_by, reason, payment_method, gateway_payment_id }: ConfirmTransactionProps) {

    //  ou tudo acontece, ou nada acontece. Recibo, arrecadação da campanha, vaga do
    // evento e log de auditoria vivem na mesma transação de banco — recibo emitido com campanha
    // desatualizada é exatamente o estado parcial que o plano proíbe.
    return await sequelize.transaction(async (t) => {
      const transaction = await Transaction.findByPk(transaction_id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      })

      if (!transaction) {
        throw new NotFoundError("Transaction Not Found")
      }

      if (transaction.status === "confirmed") {
        throw new BadRequestError("This transaction has already been confirmed")
      }

      if (transaction.status !== "pending" && transaction.status !== "awaiting_confirmation") {
        throw new BadRequestError("Only a pending or awaiting confirmation transaction can be confirmed")
      }

      const previousStatus = transaction.status

      // Dinheiro é somado no SQL, nunca lido-e-escrito no Node: duas confirmações simultâneas
      // na mesma campanha perderiam uma das somas.
      if (transaction.campaign_id) {
        await Campaign.increment(
          { raised_amount: Number(transaction.amount) },
          { where: { id: transaction.campaign_id }, transaction: t }
        )
      }

      // A vaga é debitada aqui e só aqui. O UPDATE condicional resolve a corrida
      // do último convite: quem confirma primeiro leva, e o segundo vê zero linhas afetadas.
      if (transaction.type === "ticket" && transaction.event_id) {
        const [takenSeats] = await Event.update(
          { taken_seats: literal("taken_seats + 1") },
          {
            where: {
              id: transaction.event_id,
              [Op.or]: [
                { capacity: null },
                literal("taken_seats + 1 <= capacity"),
              ],
            },
            transaction: t,
          }
        )

        if (takenSeats === 0) {
          throw new BadRequestError("The event has no seats left")
        }
      }

      await transaction.update({
        status: "confirmed",
        confirmed_at: new Date(),
        ...(payment_method !== undefined ? { payment_method } : {}),
        ...(gateway_payment_id !== undefined ? { gateway_payment_id } : {}),
      }, { transaction: t })

      await TransactionAuditLog.create({
        transaction_id,
        previous_status: previousStatus,
        new_status: "confirmed",
        source,
        performed_by,
        reason,
      }, { transaction: t })

      return transaction.get({ plain: true })
    })
  }
}
