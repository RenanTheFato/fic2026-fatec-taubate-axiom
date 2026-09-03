import { useQuery } from "@tanstack/react-query"
import { listEvents } from "../services/event/list-events-service"

export function useEvents() {
  return useQuery({
    queryKey: ["events", "list"],
    queryFn: () => listEvents(),
  })
}
