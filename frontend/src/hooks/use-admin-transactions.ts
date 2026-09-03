import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { listTransactions } from "../services/admin/list-transactions-service"
import type { TransactionFilters } from "../services/admin/list-transactions-service"
import { actOnTransaction } from "../services/admin/transaction-actions-service"
import type { TransactionAction } from "../services/admin/transaction-actions-service"

export function useAdminTransactions(filters: TransactionFilters, enabled = true) {
  return useQuery({
    queryKey: ["transactions", "list", filters],
    queryFn: () => listTransactions(filters),
    enabled,
  })
}

// Mudar o status de uma transação mexe em campanha, evento, produto e recibo.
// Invalidar só a lista de transações deixaria o painel mostrando estoque e
// arrecadação velhos, então o cache desses domínios cai junto.
export function useTransactionAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ action, id, reason }: { action: TransactionAction; id: string; reason: string }) =>
      actOnTransaction(action, id, reason),
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["receipts"] }),
        queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
        queryClient.invalidateQueries({ queryKey: ["events"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ])
    },
  })
}
