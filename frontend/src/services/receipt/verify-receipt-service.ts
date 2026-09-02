import axios from "axios"
import { api } from "../../config/api"
import { NotFoundError } from "../../config/errors"
import type { ReceiptVerification } from "../../types/receipt-types"

// Primeira chamada real do frontend ao backend. Rota pública, sem token.
//
// O 404 vira um erro de domínio aqui, e não uma checagem de texto na tela:
// "não existe esse código" é uma resposta legítima da verificação, com
// mensagem própria, e não uma falha do serviço.
export async function verifyReceipt(hash: string): Promise<ReceiptVerification> {
  try {
    const { data } = await api.get<ReceiptVerification>(`/receipt/verify/${encodeURIComponent(hash)}`)

    return data
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new NotFoundError("Recibo não encontrado")
    }

    throw error
  }
}
