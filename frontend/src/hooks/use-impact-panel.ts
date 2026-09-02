import { useQuery } from "@tanstack/react-query"
import { getImpactPanel } from "../services/impact/get-impact-panel-service"

export function useImpactPanel() {
  return useQuery({
    queryKey: ["impact", "panel"],
    queryFn: getImpactPanel,
  })
}
