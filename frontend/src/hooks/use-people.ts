import { useQuery } from "@tanstack/react-query"
import { listPeople } from "../services/institutional/list-people-service"
import type { PersonBoard } from "../types/institutional-types"

export function usePeople(board: PersonBoard) {
  return useQuery({
    queryKey: ["institutional", "people", board],
    queryFn: () => listPeople(board),
  })
}
