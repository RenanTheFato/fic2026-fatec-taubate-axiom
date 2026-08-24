import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { sequelize } from "../../config/sequelize.js";
import { TransactionInterface } from "../../interfaces/transaction-interface.js";
import { TransactionAuditLogInterface } from "../../interfaces/transaction-audit-log-interface.js";
import { Transaction } from "../../models/transaction-model.js";
import { TransactionAuditLog } from "../../models/transaction-audit-log-model.js";

interface CancelTransactionServiceProps {
  transaction_id: TransactionInterface['id'],
  source: TransactionAuditLogInterface['source'],
  performed_by: TransactionAuditLogInterface['performed_by'],
  reason: TransactionAuditLogInterface['reason'],
}

export class CancelTransactionService {
  async execute({ transaction_id, source, performed_by, reason }: CancelTransactionServiceProps) {

    // Checkout abandonado, cancelado antes de qualquer pagamento confirmado. Nenhum efeito
    // financeiro foi aplicado ainda, então não há arrecadação nem vaga para reverter.
    return await sequelize.transaction(async (t) => {
      const transaction = await Transaction.findByPk(transaction_id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      })

      if (!transaction) {
        throw new NotFoundError("Transaction Not Found")
      }

      if (transaction.status !== "pending" && transaction.status !== "awaiting_confirmation") {
        throw new BadRequestError("Only a pending or awaiting confirmation transaction can be cancelled")
      }

      const previousStatus = transaction.status

      await transaction.update({ status: "cancelled" }, { transaction: t })

      // não existe UPDATE de status sem log correspondente.
      await TransactionAuditLog.create({
        transaction_id,
        previous_status: previousStatus,
        new_status: "cancelled",
        source,
        performed_by,
        reason,
      }, { transaction: t })

      return transaction.get({ plain: true })
    })
  }
}
