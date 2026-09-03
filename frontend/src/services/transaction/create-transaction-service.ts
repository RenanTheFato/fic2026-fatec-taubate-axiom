import axios from "axios"
import { api } from "../../config/api"
import { CheckoutError } from "../../config/errors"
import type { CreateTransactionInput, Transaction } from "../../types/transaction-types"

type CreateTransactionResponse = {
  transaction: Transaction & { items: unknown[] }
}

// `POST /transaction/create` é público: quem doa não tem conta. A transação
// nasce `pending` e só depois o backend cria a sessão no gateway, então o
// `checkout_url` pode voltar nulo se a rede falhar exatamente ali, e é o órfão
// descrito em `backend/corrections.md`, item F. Tratar isso como sucesso
// mandaria o doador para lugar nenhum, então vira erro com mensagem própria.
export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  try {
    const { data } = await api.post<CreateTransactionResponse>("/transaction/create", input)

    if (!data.transaction.checkout_url) {
      throw new CheckoutError(
        "O pedido foi registrado, mas o pagamento não pôde ser aberto. A equipe consegue retomá-lo pelo número do pedido.",
      )
    }

    return data.transaction
  } catch (error: unknown) {
    if (error instanceof CheckoutError) {
      throw error
    }

    // O backend recusa com 400 quando a regra é de negócio: evento lotado,
    // produto sem estoque, campanha encerrada. A mensagem dele é mais útil que
    // qualquer texto genérico, porque diz qual das regras impediu a compra.
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      const data = error.response.data as { error?: string } | undefined

      throw new CheckoutError(data?.error ?? "Não foi possível registrar o pedido.")
    }

    throw error
  }
}
