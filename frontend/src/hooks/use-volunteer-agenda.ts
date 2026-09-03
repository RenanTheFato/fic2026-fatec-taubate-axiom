import { useQuery } from "@tanstack/react-query"
import {
  getVolunteerSummary,
  listVolunteerAgenda,
} from "../services/volunteer/list-volunteer-agenda-service"

// A agenda é simulada hoje, mas passa pelo React Query igual às outras leituras.
// Assim a tela já tem carregando, erro e vazio de verdade, e quando a vertical de
// voluntariado existir no backend nada muda daqui para cima.
export function useVolunteerAgenda() {
  return useQuery({
    queryKey: ["volunteer", "agenda"],
    queryFn: listVolunteerAgenda,
  })
}

export function useVolunteerSummary() {
  return useQuery({
    queryKey: ["volunteer", "summary"],
    queryFn: getVolunteerSummary,
  })
}
