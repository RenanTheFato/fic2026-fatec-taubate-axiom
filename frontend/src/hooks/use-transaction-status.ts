import { useQuery } from "@tanstack/react-query"
import { getTransactionStatus, isSettled } from "../services/transaction/get-transaction-status-service"

// A tela de status nunca afirma sucesso sozinha. Ela pergunta ao backend de
// tempos em tempos e só diz "confirmada" quando ele diz. Quem confirma é o
// webhook do gateway, não o fato de o navegador ter voltado.
//
// A consulta para de repetir assim que o status é final. Um pedido que fica em
// processamento não fica sendo consultado para sempre: depois do teto o backend
// continua trabalhando, e a tela passa a dizer que o e-mail chega em breve, que
// é a verdade, e não um erro.
export const POLL_INTERVAL = 3_000

export const MAX_ATTEMPTS = 12

export function useTransactionStatus(id: string) {
  return useQuery({
    queryKey: ["transactions", "status", id],
    queryFn: () => getTransactionStatus(id),
    enabled: id.length > 0,
    retry: false,
    staleTime: 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status

      if (status && isSettled(status)) return false
      if (query.state.dataUpdateCount >= MAX_ATTEMPTS) return false

      return POLL_INTERVAL
    },
  })
}
