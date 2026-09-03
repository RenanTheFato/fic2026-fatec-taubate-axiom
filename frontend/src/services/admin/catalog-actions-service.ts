import axios from "axios"
import { api } from "../../config/api"
import { CheckoutError } from "../../config/errors"

// Ações de divulgação: publicar, encerrar, cancelar, ativar, desativar e repor
// estoque. Nenhuma delas pede motivo, porque diferente das de dinheiro elas não
// mexem em recibo nem em arrecadação, e não precisam de trilha de auditoria.
//
// Cancelar campanha ou evento responde só a `admin`: é destrutivo, e a divisão
// de papéis do backend reserva o destrutivo para a administração.
export type CatalogAction =
  | { domain: "campaign"; action: "publish" | "finish" | "cancel"; id: string }
  | { domain: "event"; action: "publish" | "finish" | "cancel"; id: string }
  | { domain: "product"; action: "activate" | "deactivate"; id: string }
  | { domain: "product"; action: "stock"; id: string; stock: number }

export async function actOnCatalog(operation: CatalogAction): Promise<void> {
  const body = operation.domain === "product" && operation.action === "stock" ? { stock: operation.stock } : undefined

  try {
    await api.patch(`/${operation.domain}/${operation.action}/${encodeURIComponent(operation.id)}`, body)
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status
      const data = error.response.data as { error?: string } | undefined

      if (status === 403) {
        throw new CheckoutError("Seu perfil não tem permissão para esta ação. Ela responde à administração.")
      }

      if (status === 400 || status === 404) {
        throw new CheckoutError(data?.error ?? "A operação não pôde ser concluída.")
      }
    }

    throw error
  }
}
