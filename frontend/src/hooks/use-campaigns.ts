import { useQuery } from "@tanstack/react-query"
import { getCampaignBySlug } from "../services/campaign/get-campaign-by-slug-service"
import { listActiveCampaigns, listCampaigns } from "../services/campaign/list-campaigns-service"

export function useActiveCampaigns() {
  return useQuery({
    queryKey: ["campaigns", "active"],
    queryFn: () => listActiveCampaigns(),
  })
}

// Ativas e encerradas: a encerrada continua no ar como registro do que foi
// feito e de quem ajudou a fazer.
export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns", "public"],
    queryFn: () => listCampaigns(),
  })
}

export function useCampaign(slug: string) {
  return useQuery({
    queryKey: ["campaigns", "detail", slug],
    queryFn: () => getCampaignBySlug(slug),
    enabled: slug.length > 0,
    retry: false,
  })
}
