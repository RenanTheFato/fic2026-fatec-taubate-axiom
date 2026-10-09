import { useQuery } from "@tanstack/react-query"
import {
  getVolunteerSummary,
  listVolunteerAgenda,
} from "../services/volunteer/list-volunteer-agenda-service"

// A agenda passa pelo React Query como qualquer outra leitura, então a tela tem
// carregando, erro e vazio de verdade, e o dia em que a vertical de voluntariado
// existir no backend nada muda daqui para cima.
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
