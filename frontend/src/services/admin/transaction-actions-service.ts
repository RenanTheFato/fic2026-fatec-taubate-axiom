import axios from "axios"
import { api } from "../../config/api"
import { CheckoutError } from "../../config/errors"

export type TransactionAction = "confirm" | "refuse" | "cancel" | "refund"

// Toda mudança de status exige um motivo, entre 3 e 255 caracteres. Não é
// burocracia: a linha vai para `transaction_audit_logs` com o autor junto, e é
// a única forma de saber depois por que um pagamento mudou de estado.
export async function actOnTransaction(action: TransactionAction, id: string, reason: string) {
  try {
    await api.patch(`/transaction/${action}/${encodeURIComponent(id)}`, { reason })
  } catch (error: unknown) {
    // 400 aqui é regra de negócio, não falha: transação já confirmada, estado
    // que não permite a mudança, evento sem vaga. A mensagem do backend diz
    // qual regra recusou, e é ela que o operador precisa ler.
    if (axios.isAxiosError(error) && (error.response?.status === 400 || error.response?.status === 404)) {
      const data = error.response.data as { error?: string } | undefined

      throw new CheckoutError(data?.error ?? "A operação não pôde ser concluída.")
    }

    throw error
  }
}

export const ACTION_LABEL: Record<TransactionAction, string> = {
  confirm: "Confirmar",
  refuse: "Recusar",
  cancel: "Cancelar",
  refund: "Estornar",
}

// O que a ação faz de verdade, escrito para quem vai clicar. Confirmar e
// estornar mexem em dinheiro, estoque e vaga, e emitem ou cancelam um recibo.
export const ACTION_CONSEQUENCE: Record<TransactionAction, string> = {
  confirm:
    "Soma o valor à campanha, debita a vaga ou o estoque e emite o recibo na corrente. Não tem desfazer: o caminho de volta é o estorno.",
  refuse: "Marca a transação como recusada. Nada é debitado e nenhum recibo é emitido.",
  cancel: "Encerra a transação sem cobrança. Use quando o pedido não vai mais acontecer.",
  refund:
    "Devolve o valor pelo gateway, desfaz a arrecadação, devolve a vaga e o estoque e cancela o recibo, que continua autêntico mas deixa de valer.",
}
