import { useQuery } from "@tanstack/react-query"
import { listActiveCampaigns } from "../services/campaign/list-campaigns-service"

export function useActiveCampaigns() {
  return useQuery({
    queryKey: ["campaigns", "active"],
    queryFn: () => listActiveCampaigns(),
  })
}
