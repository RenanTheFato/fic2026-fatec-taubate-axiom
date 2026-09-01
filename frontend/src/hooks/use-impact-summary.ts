import { useQuery } from "@tanstack/react-query"
import { getImpactSummary } from "../services/impact/get-impact-summary-service"

export function useImpactSummary() {
  return useQuery({
    queryKey: ["impact", "summary"],
    queryFn: getImpactSummary,
  })
}
