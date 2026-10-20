import axios from "axios"
import { api } from "../../config/api"
import { CheckoutError } from "../../config/errors"
import type { Campaign } from "../../types/campaign-types"
import type { ApiEvent } from "../../types/event-types"
import type { Product } from "../../types/product-types"

// Cadastro e edição do catálogo pelo painel. Tudo nasce em rascunho (campanha e
// evento) ou fora da loja (produto): pôr no ar continua sendo a ação própria da
// lista, separada de propósito, para que salvar um cadastro pela metade nunca o
// publique por engano.
//
// O slug não muda na edição, no backend. Link já divulgado continua valendo
// depois de um ajuste de título.

export type CampaignInput = {
  title: string
  description: string | null
  image_url: string | null
  goal_amount: number
  starts_at: string
  ends_at: string | null
}

export type EventInput = {
  campaign_id: string | null
  title: string
  description: string | null
  location: string | null
  image_url: string | null
  starts_at: string
  ends_at: string | null
  ticket_price: number
}

export type ProductInput = {
  name: string
  sku: string | null
  description: string | null
  price: number
  image_url: string | null
}

export async function saveCampaign({ id, ...body }: CampaignInput & { id?: string }): Promise<Campaign> {
  try {
    const { data } = id
      ? await api.put<{ campaign: Campaign }>(`/campaign/update/${encodeURIComponent(id)}`, body)
      : await api.post<{ campaign: Campaign }>("/campaign/create", body)

    return data.campaign
  } catch (error: unknown) {
    throw refusal(error, "A campanha não pôde ser salva.")
  }
}

// A lotação só entra no cadastro novo. Depois disso ela tem rota própria,
// porque é a única alteração que precisa ser conferida contra as vagas já
// ocupadas.
export async function createEvent(body: EventInput & { capacity: number | null }): Promise<ApiEvent> {
  try {
    const { data } = await api.post<{ event: ApiEvent }>("/event/create", body)

    return data.event
  } catch (error: unknown) {
    throw refusal(error, "O evento não pôde ser salvo.")
  }
}

export async function updateEvent(id: string, body: EventInput): Promise<ApiEvent> {
  try {
    const { data } = await api.put<{ event: ApiEvent }>(`/event/update/${encodeURIComponent(id)}`, body)

    return data.event
  } catch (error: unknown) {
    throw refusal(error, "O evento não pôde ser salvo.")
  }
}

export async function updateEventCapacity(id: string, capacity: number | null): Promise<ApiEvent> {
  try {
    const { data } = await api.patch<{ event: ApiEvent }>(`/event/capacity/${encodeURIComponent(id)}`, { capacity })

    return data.event
  } catch (error: unknown) {
    throw refusal(error, "A lotação não pôde ser alterada.")
  }
}

// O estoque inicial entra só no cadastro novo; repor é a ação da própria
// coluna "Estoque" na lista.
export async function saveProduct({ id, stock, ...body }: ProductInput & { id?: string; stock?: number }): Promise<Product> {
  try {
    const { data } = id
      ? await api.put<{ product: Product }>(`/product/update/${encodeURIComponent(id)}`, body)
      : await api.post<{ product: Product }>("/product/create", { ...body, stock })

    return data.product
  } catch (error: unknown) {
    throw refusal(error, "O produto não pôde ser salvo.")
  }
}

export type CatalogDeletion = { domain: "campaign" | "event" | "product"; id: string }

// Excluir responde só a `admin`, e só o que nunca foi ao ar: campanha e evento
// em rascunho, produto que nunca entrou no catálogo. O resto sai por
// encerramento, cancelamento ou desativação, que guardam o histórico.
export async function deleteFromCatalog({ domain, id }: CatalogDeletion): Promise<void> {
  try {
    await api.delete(`/${domain}/delete/${encodeURIComponent(id)}`)
  } catch (error: unknown) {
    throw refusal(error, "A exclusão não pôde ser concluída.")
  }
}

function refusal(error: unknown, fallback: string): unknown {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data as { error?: string; errors?: { message: string }[] } | undefined

    if (error.response.status === 403) {
      return new CheckoutError("Seu perfil não tem permissão para esta ação. Ela responde à administração.")
    }

    if (error.response.status === 400 || error.response.status === 404) {
      return new CheckoutError(data?.errors?.[0]?.message ?? data?.error ?? fallback)
    }
  }

  return error
}
