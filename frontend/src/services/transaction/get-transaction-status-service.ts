import axios from "axios"
import { api } from "../../config/api"
import { NotFoundError } from "../../config/errors"
import type { TransactionStatusView } from "../../types/transaction-types"

type GetTransactionStatusResponse = {
  transaction: TransactionStatusView
}

// Rota pública de acompanhamento: quem volta do checkout não tem conta, e o id
// da transação é a credencial: um UUID que só quem criou o pedido recebeu.
//
// Voltar do gateway não é prova de pagamento. Quem confirma é o webhook, e é
// por isso que a tela pergunta o status em vez de afirmá-lo.
export async function getTransactionStatus(id: string): Promise<TransactionStatusView> {
  try {
    const { data } = await api.get<GetTransactionStatusResponse>(`/transaction/status/${encodeURIComponent(id)}`)

    return data.transaction
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 400)) {
      throw new NotFoundError("Pedido não encontrado")
    }

    throw error
  }
}

// Estados em que ainda faz sentido perguntar de novo. Fora deles a resposta é
// final e continuar consultando só gasta bateria de quem está esperando.
export function isSettled(status: TransactionStatusView["status"]): boolean {
  return status !== "pending" && status !== "awaiting_confirmation"
}
