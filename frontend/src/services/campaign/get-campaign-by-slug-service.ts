import axios from "axios"
import { api } from "../../config/api"
import { NotFoundError } from "../../config/errors"
import type { Campaign } from "../../types/campaign-types"

type GetCampaignResponse = {
  campaign: Campaign
}

// `GET /campaign/:slug` é público e só enxerga campanha ativa ou encerrada:
// rascunho e cancelada respondem 404, como se não existissem. A tela decide
// pelo tipo do erro, igual ao evento e à notícia.
export async function getCampaignBySlug(slug: string): Promise<Campaign> {
  try {
    const { data } = await api.get<GetCampaignResponse>(`/campaign/${encodeURIComponent(slug)}`)

    return data.campaign
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new NotFoundError("Campanha não encontrada")
    }

    throw error
  }
}
