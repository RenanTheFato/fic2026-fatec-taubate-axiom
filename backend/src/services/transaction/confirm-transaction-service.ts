import { literal, Op } from "sequelize";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { sequelize } from "../../config/sequelize.js";
import { TransactionInterface } from "../../interfaces/transaction-interface.js";
import { TransactionAuditLogInterface } from "../../interfaces/transaction-audit-log-interface.js";
import { Campaign } from "../../models/campaign-model.js";
import { Event } from "../../models/event-model.js";
import { Product } from "../../models/product-model.js";
import { Transaction } from "../../models/transaction-model.js";
import { TransactionAuditLog } from "../../models/transaction-audit-log-model.js";
import { TransactionItem } from "../../models/transaction-item-model.js";
import { IssueReceiptService } from "../receipt/issue-receipt-service.js";

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

      // Dinheiro é somado no SQL
      if (transaction.campaign_id) {
        await Campaign.increment(
          { raised_amount: Number(transaction.amount) },
          { where: { id: transaction.campaign_id }, transaction: t }
        )
      }

      // A vaga é debitada aqui e só aqui. O UPDATE condicional resolve a corrida
      // do último convite, quem confirma primeiro leva, e o segundo vê zero linhas afetadas
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

      // O estoque é debitado aqui e só aqui, pela mesma razão que a vaga: na criação ainda não
      // há dinheiro. O UPDATE é condicional e a decisão é do banco — ler o estoque, decidir em
      // JavaScript e escrever depois é a corrida que vende a última camiseta duas vezes.
      // A ordem por product_id não é estética: duas confirmações simultâneas que travem os
      // mesmos produtos em ordens opostas se bloqueiam em deadlock. Travar sempre na mesma
      // ordem faz uma esperar a outra em vez de as duas morrerem.
      const items = await TransactionItem.findAll({
        where: { transaction_id },
        order: [["product_id", "ASC"]],
        transaction: t,
      })

      for (const item of items) {
        if (!item.product_id) {
          continue
        }

        // A quantidade vem de uma coluna INTEGER e é reconvertida antes de entrar no SQL:
        // literal não é parametrizado, então nada que não seja dígito pode chegar até aqui.
        const quantity = Math.trunc(Number(item.quantity))

        const [updatedProducts] = await Product.update(
          { stock: literal(`stock - ${quantity}`) },
          {
            where: {
              id: item.product_id,
              stock: { [Op.gte]: quantity },
            },
            transaction: t,
          }
        )

        if (updatedProducts === 0) {
          throw new BadRequestError(`The product "${item.description}" has no stock left`)
        }
      }

      await transaction.update({
        status: "confirmed",
        confirmed_at: new Date(),
        ...(payment_method !== undefined ? { payment_method } : {}),
        ...(gateway_payment_id !== undefined ? { gateway_payment_id } : {}),
      }, { transaction: t })

      // o recibo é emitido aqui dentro, não depois, lista a emissão entre os efeitos
      // da confirmação, e um recibo gravado fora desta transação poderia sobreviver a um rollback
      // que desfez a confirmação, documento válido para pagamento que nunca foi confirmado
      const receipt = await new IssueReceiptService().execute({
        transaction,
        database_transaction: t,
      })

      await TransactionAuditLog.create({
        transaction_id,
        previous_status: previousStatus,
        new_status: "confirmed",
        source,
        performed_by,
        reason,
      }, { transaction: t })

      return { ...transaction.get({ plain: true }), receipt }
    })
  }
}
