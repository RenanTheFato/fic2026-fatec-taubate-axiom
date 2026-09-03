import { useQuery } from "@tanstack/react-query"
import { getEventBySlug } from "../services/event/get-event-by-slug-service"

export function useEvent(slug: string) {
  return useQuery({
    queryKey: ["events", "detail", slug],
    queryFn: () => getEventBySlug(slug),
    enabled: slug.length > 0,
    retry: false,
  })
}
