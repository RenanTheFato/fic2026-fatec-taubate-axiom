import { useQuery } from "@tanstack/react-query"
import { getCertificateView } from "../services/receipt/certificate-view-service"

// Só pergunta quando há um código completo na URL. Um certificado emitido não
// muda (o cancelamento é a única exceção, e é raro), então ele fica em cache.
export function useCertificateView(hash: string) {
  return useQuery({
    queryKey: ["receipt", "certificate", hash],
    queryFn: () => getCertificateView(hash),
    enabled: hash.length > 0,
    retry: false,
    staleTime: 5 * 60_000,
  })
}
