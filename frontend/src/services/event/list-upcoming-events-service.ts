import type { Event } from "../../types/event-types"
import { byStartDate, isUpcoming, listEvents } from "./list-events-service"

// A agenda da home. A rota não filtra por data nem ordena crescente, porque ela
// devolve tudo o que é público, do mais recente para o mais antigo. Então o
// recorte de "próximos" é feito aqui, uma vez, e não repetido em cada tela.
export async function listUpcomingEvents(limit = 3): Promise<Event[]> {
  const { events } = await listEvents()

  return events.filter((event) => isUpcoming(event)).sort(byStartDate("asc")).slice(0, limit)
}
