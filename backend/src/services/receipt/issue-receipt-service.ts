import { Transaction as DatabaseTransaction } from "sequelize";
import { NotFoundError } from "../../config/errors.js";
import { Donor } from "../../models/donor-model.js";
import { Receipt } from "../../models/receipt-model.js";
import { Transaction } from "../../models/transaction-model.js";
import { buildReceiptHash, buildReceiptNumber, truncateToSecond } from "../../utils/receipt-hash.js";

interface IssueReceiptProps {
  transaction: Transaction,
  database_transaction: DatabaseTransaction,
}

export class IssueReceiptService {
  async execute({ transaction, database_transaction }: IssueReceiptProps) {

    const donor = await Donor.findByPk(transaction.donor_id, { transaction: database_transaction })

    if (!donor) {
      throw new NotFoundError("Donor Not Found")
    }

    // O último recibo da corrente é lido com trava, enquanto esta emissão não terminar, nenhuma
    // outra consegue ler a mesma ponta e calcular a mesma sequence. na primeira emissão não
    // existe linha para travar, e é o índice único de sequence que impede o empate.
    const previousReceipt = await Receipt.findOne({
      order: [["sequence", "DESC"]],
      transaction: database_transaction,
      lock: database_transaction.LOCK.UPDATE,
    })

    const sequence = previousReceipt ? previousReceipt.sequence + 1 : 1
    const previousHash = previousReceipt ? previousReceipt.hash : null
    const issuedAt = truncateToSecond(new Date())
    const number = buildReceiptNumber(sequence, issuedAt)

    const hash = buildReceiptHash({
      sequence,
      number,
      transaction_id: transaction.id,
      transaction_type: transaction.type,
      amount: transaction.amount,
      donor_name: donor.name,
      donor_document: donor.document,
      issued_at: issuedAt,
      previous_hash: previousHash,
    })

    const receipt = await Receipt.create({
      transaction_id: transaction.id,
      sequence,
      number,
      donor_name: donor.name,
      donor_document: donor.document,
      amount: transaction.amount,
      transaction_type: transaction.type,
      issued_at: issuedAt,
      previous_hash: previousHash,
      hash,
    }, { transaction: database_transaction })

    return receipt.get({ plain: true })
  }
}
