import { useQuery } from "@tanstack/react-query"
import { listUpcomingEvents } from "../services/event/list-upcoming-events-service"

export function useUpcomingEvents(limit = 3) {
  return useQuery({
    queryKey: ["events", "upcoming", limit],
    queryFn: () => listUpcomingEvents(limit),
  })
}
