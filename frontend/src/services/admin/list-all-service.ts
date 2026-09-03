import { api } from "../../config/api"
import type { Campaign } from "../../types/campaign-types"
import type { ApiEvent } from "../../types/event-types"
import type { Product } from "../../types/product-types"

// As rotas `/list-all` respondem a admin e comunicação, e trazem o que a
// listagem pública esconde: rascunho, cancelado e produto desativado. É a
// diferença entre o catálogo do visitante e o painel de quem o edita.

type ListAllCampaignsResponse = { campaigns: Campaign[]; total: number }

export async function listAllCampaigns() {
  const { data } = await api.get<ListAllCampaignsResponse>("/campaign/list-all", { params: { limit: 50 } })

  return data.campaigns
}

type ListAllEventsResponse = { events: ApiEvent[]; total: number }

export async function listAllEvents() {
  const { data } = await api.get<ListAllEventsResponse>("/event/list-all", { params: { limit: 50 } })

  return data.events
}

type ListAllProductsResponse = { products: Product[]; total: number }

export async function listAllProducts() {
  const { data } = await api.get<ListAllProductsResponse>("/product/list-all", { params: { limit: 50 } })

  return data.products
}
