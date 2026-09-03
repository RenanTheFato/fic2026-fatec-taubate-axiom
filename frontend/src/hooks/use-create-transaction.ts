import { useMutation } from "@tanstack/react-query"
import { createTransaction } from "../services/transaction/create-transaction-service"
import type { CreateTransactionInput } from "../types/transaction-types"

// O checkout é uma ação, não uma leitura: mutation, nunca query. E não há
// retentativa automática, porque repetir sozinho um pedido de pagamento é como o
// sistema cria duas cobranças para a mesma pessoa.
export function useCreateTransaction() {
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => createTransaction(input),
    retry: false,
  })
}
