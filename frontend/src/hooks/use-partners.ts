import { useQuery } from "@tanstack/react-query"
import { listPartners } from "../services/partner/list-partners-service"

export function usePartners() {
  return useQuery({
    queryKey: ["partners", "list"],
    queryFn: listPartners,
  })
}
