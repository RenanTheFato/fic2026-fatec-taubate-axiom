import { NotFoundError } from "../../config/errors.js";
import { TransactionInterface } from "../../interfaces/transaction-interface.js";
import { Receipt } from "../../models/receipt-model.js";
import { Transaction } from "../../models/transaction-model.js";

interface GetTransactionStatusProps {
  id: TransactionInterface['id'],
}

// Acompanhamento público do pedido. Quem volta do checkout não tem conta, então `GET /:id`, que
// responde a admin e finance, não serve, e afirmar sucesso porque o gateway devolveu o navegador
// seria afirmar um pagamento que ninguém confirmou. A credencial aqui é o próprio id: um UUID v4
// que só quem criou a transação recebeu, na mesma lógica do hash do recibo.
//
// O retorno é deliberadamente magro. Nome, e-mail e documento do doador não saem por rota pública,
// e o link do recibo só existe depois de confirmado, porque antes disso não há documento nenhum.
export class GetTransactionStatusService {
  async execute({ id }: GetTransactionStatusProps) {

    const transaction = await Transaction.findByPk(id, {
      attributes: ["id", "type", "status", "amount", "payment_method", "confirmed_at", "created_at"],
    })

    if (!transaction) {
      throw new NotFoundError("Transaction Not Found")
    }

    const receipt = transaction.status === "confirmed"
      ? await Receipt.findOne({
        where: { transaction_id: id },
        attributes: ["hash", "number"],
      })
      : null

    return {
      id: transaction.id,
      type: transaction.type,
      status: transaction.status,
      amount: transaction.amount,
      payment_method: transaction.payment_method,
      confirmed_at: transaction.confirmed_at,
      created_at: transaction.created_at,
      receipt_hash: receipt ? receipt.hash : null,
      receipt_number: receipt ? receipt.number : null,
    }
  }
}
