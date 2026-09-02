import { useQuery } from "@tanstack/react-query"
import { listFaq } from "../services/institutional/list-faq-service"

export function useFaq() {
  return useQuery({
    queryKey: ["institutional", "faq"],
    queryFn: listFaq,
  })
}
