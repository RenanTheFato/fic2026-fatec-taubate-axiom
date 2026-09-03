import { Transaction as DatabaseTransaction } from "sequelize";
import { NotFoundError } from "../../config/errors.js";
import { Donor } from "../../models/donor-model.js";
import { Receipt } from "../../models/receipt-model.js";
import { ReceiptSequence, RECEIPT_SEQUENCE_ID } from "../../models/receipt-sequence-model.js";
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

    // A fila da corrente. Travar a ponta de "receipts" com ORDER BY ... FOR UPDATE parecia o
    // caminho natural e não é: além da última linha, o InnoDB trava o intervalo aberto depois
    // dela, que é justamente onde toda emissão precisa inserir: confirmações simultâneas se
    // matavam em deadlock, e a maioria dos pagamentos falhava. Travando sempre a mesma linha
    // pela chave primária, as emissões esperam umas pelas outras em vez de morrerem.
    const allocator = await ReceiptSequence.findByPk(RECEIPT_SEQUENCE_ID, {
      transaction: database_transaction,
      lock: database_transaction.LOCK.UPDATE,
    })

    if (!allocator) {
      throw new NotFoundError("Receipt Sequence Not Found")
    }

    const sequence = allocator.last_sequence + 1

    // O elo anterior é lido com trava, e não por disputa: em REPEATABLE READ um SELECT comum
    // enxerga o retrato do banco de quando esta transação começou, e o recibo que a emissão
    // logo antes desta acabou de gravar simplesmente não estaria lá: a corrente nasceria com
    // previous_hash nulo no meio. Leitura travada sempre lê a última versão confirmada. Aqui ela
    // é segura porque a fila do alocador garante que só há uma emissão neste trecho por vez, e
    // porque sequence é índice único, então trava um ponto e não um intervalo.
    const previousReceipt = sequence > 1
      ? await Receipt.findOne({
        where: { sequence: sequence - 1 },
        transaction: database_transaction,
        lock: database_transaction.LOCK.UPDATE,
      })
      : null

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

    // O avanço do contador é a última coisa: se qualquer passo acima falhar, a transação de banco
    // volta atrás e a sequência não foi consumida.
    await allocator.update({ last_sequence: sequence }, { transaction: database_transaction })

    return receipt.get({ plain: true })
  }
}
