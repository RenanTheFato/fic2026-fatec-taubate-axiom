import { Transaction as DatabaseTransaction } from "sequelize";
import { Receipt } from "../../models/receipt-model.js";
import { TransactionInterface } from "../../interfaces/transaction-interface.js";

interface CancelReceiptProps {
  transaction_id: TransactionInterface['id'],
  database_transaction: DatabaseTransaction,
}

export class CancelReceiptService {
  async execute({ transaction_id, database_transaction }: CancelReceiptProps) {

    const receipt = await Receipt.findOne({
      where: { transaction_id },
      transaction: database_transaction,
      lock: database_transaction.LOCK.UPDATE,
    })

    // Estorno de transação confirmada antes de o recibo existir não tem o que cancelar
    if (!receipt) {
      return null
    }

    if (receipt.status === "cancelled") {
      return receipt.get({ plain: true })
    }

    // O cancelamento não toca em nada que entra no hash, a corrente prova que o
    // documento emitido não foi adulterado, e recalcular o hash aqui invalidaria todos os elos seguintes.
    await receipt.update({
      status: "cancelled",
      cancelled_at: new Date(),
    }, { transaction: database_transaction })

    return receipt.get({ plain: true })
  }
}
