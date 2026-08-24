import { NotFoundError } from "../../config/errors.js";
import { ReceiptInterface } from "../../interfaces/receipt-interface.js";
import { Receipt } from "../../models/receipt-model.js";
import { buildReceiptHash } from "../../utils/receipt-hash.js";
import { maskDocument } from "../../utils/mask-document.js";

interface VerifyReceiptProps {
  hash: ReceiptInterface['hash'],
}

export class VerifyReceiptService {
  async execute({ hash }: VerifyReceiptProps) {

    const receipt = await Receipt.findOne({ where: { hash } })

    if (!receipt) {
      throw new NotFoundError("Receipt Not Found")
    }

    // o hash guardado é mesmo o hash do conteúdo guardado. Se alguém editou o
    // valor ou o nome direto no banco, o recálculo não bate.
    const recomputedHash = buildReceiptHash({
      sequence: receipt.sequence,
      number: receipt.number,
      transaction_id: receipt.transaction_id,
      transaction_type: receipt.transaction_type,
      amount: receipt.amount,
      donor_name: receipt.donor_name,
      donor_document: receipt.donor_document,
      issued_at: receipt.issued_at,
      previous_hash: receipt.previous_hash,
    })

    const contentMatches = recomputedHash === receipt.hash

    // o elo com o recibo anterior. Cobre o que a primeira não cobre — recalcular o
    // hash de um recibo adulterado só o conserta isolado, porque o elo do recibo seguinte ainda
    // aponta para o hash antigo. E apagar um recibo do meio some com o antecessor esperado.
    const previousReceipt = receipt.sequence > 1 ? await Receipt.findOne({
      where: {
        sequence: receipt.sequence - 1
      }
    }) : null

    const chainMatches = previousReceipt ? previousReceipt.hash === receipt.previous_hash : receipt.previous_hash === null

    const authentic = contentMatches && chainMatches

    return {
      authentic,
      valid: authentic && receipt.status === "issued",
      checks: {
        content_matches: contentMatches,
        chain_matches: chainMatches,
      },
      receipt: {
        number: receipt.number,
        sequence: receipt.sequence,
        status: receipt.status,
        donor_name: receipt.donor_name,
        donor_document: maskDocument(receipt.donor_document),
        amount: receipt.amount,
        transaction_type: receipt.transaction_type,
        issued_at: receipt.issued_at,
        cancelled_at: receipt.cancelled_at,
        hash: receipt.hash,
        previous_hash: receipt.previous_hash,
      },
    }
  }
}
