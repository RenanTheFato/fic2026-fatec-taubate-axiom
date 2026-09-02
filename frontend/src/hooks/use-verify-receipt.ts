import { useQuery } from "@tanstack/react-query"
import { verifyReceipt } from "../services/receipt/verify-receipt-service"

// A consulta só dispara quando há um código submetido: `enabled` desligado
// evita uma requisição a cada tecla digitada no campo.
export function useVerifyReceipt(hash: string) {
  return useQuery({
    queryKey: ["receipt", "verify", hash],
    queryFn: () => verifyReceipt(hash),
    enabled: hash.length > 0,
    retry: false,
    staleTime: 5 * 60_000,
  })
}
