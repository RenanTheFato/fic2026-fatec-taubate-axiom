import { useQuery } from "@tanstack/react-query"
import { getSubscription } from "../services/subscription/get-subscription-service"

export function useSubscription(token: string | undefined) {
  return useQuery({
    queryKey: ["subscription", token],
    queryFn: () => getSubscription(token as string),
    enabled: Boolean(token),
    retry: false,
  })
}
