import { api } from "../../config/api"
import type { Campaign } from "../../types/campaign-types"

type ListCampaignsResponse = {
  campaigns: Campaign[]
  total: number
}

// `GET /campaign/list` é público e traz as campanhas publicadas, ativas e
// encerradas. Quem pode receber doação nova é só a ativa, porque o backend recusa
// as outras. Então a vitrine de necessidades filtra por status antes de mostrar.
export async function listCampaigns(): Promise<Campaign[]> {
  const { data } = await api.get<ListCampaignsResponse>("/campaign/list", { params: { limit: 50 } })

  return data.campaigns
}

export async function listActiveCampaigns(): Promise<Campaign[]> {
  const campaigns = await listCampaigns()

  return campaigns.filter((campaign) => campaign.status === "active")
}

// Quanto da meta já entrou, limitado a 100: uma campanha que passou da meta
// continua sendo uma barra cheia, não uma barra que vaza para fora do trilho.
export function campaignProgress(campaign: Campaign): number {
  const goal = Number(campaign.goal_amount)
  const raised = Number(campaign.raised_amount)

  if (!Number.isFinite(goal) || goal <= 0) return 0

  return Math.min(Math.round((raised / goal) * 100), 100)
}
