import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { actOnCatalog } from "../services/admin/catalog-actions-service"
import { listAllCampaigns, listAllEvents, listAllProducts } from "../services/admin/list-all-service"
import { listDonors } from "../services/admin/list-donors-service"
import { listReceipts } from "../services/admin/list-receipts-service"
import { summarizeItems } from "../services/admin/summarize-items-service"

// Toda consulta do painel aceita `enabled` porque o backend divide as rotas por
// papel: catálogo responde a `admin` e `communication`, dinheiro responde a
// `admin` e `finance`. Uma tela que dispara as duas famílias sem perguntar quem
// está logado ganha um 403 de graça, e o 403 chega na interface como "não
// carregou", que é uma mentira: carregar não era para acontecer.
export function useAllCampaigns(enabled = true) {
  return useQuery({ queryKey: ["campaigns", "all"], queryFn: listAllCampaigns, enabled })
}

export function useAllEvents(enabled = true) {
  return useQuery({ queryKey: ["events", "all"], queryFn: listAllEvents, enabled })
}

export function useAllProducts(enabled = true) {
  return useQuery({ queryKey: ["products", "all"], queryFn: listAllProducts, enabled })
}

export function useAdminReceipts(page = 1, enabled = true) {
  return useQuery({ queryKey: ["receipts", "list", page], queryFn: () => listReceipts(page), enabled })
}

export function useAdminDonors(page = 1, enabled = true) {
  return useQuery({ queryKey: ["donors", "list", page], queryFn: () => listDonors(page), enabled })
}

export function useItemSummary(enabled = true) {
  return useQuery({ queryKey: ["transaction-items", "summary"], queryFn: summarizeItems, enabled })
}

// Publicar, encerrar, ativar ou repor estoque muda o que o site público mostra,
// então o cache das listagens públicas cai junto com o da listagem do painel.
// Sem isso a pessoa publica um evento e continua vendo "rascunho" na outra aba.
export function useCatalogAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: actOnCatalog,
    retry: false,
    onSuccess: async (_result, operation) => {
      const domain = operation.domain === "campaign" ? "campaigns" : operation.domain === "event" ? "events" : "products"

      await queryClient.invalidateQueries({ queryKey: [domain] })
    },
  })
}
