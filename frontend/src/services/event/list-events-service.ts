import { api } from "../../config/api"
import type { ApiEvent, Event } from "../../types/event-types"
import { resolveEventImage } from "./event-image"

type ListEventsResponse = {
  events: ApiEvent[]
  total: number
}

export type EventList = {
  events: Event[]
  total: number
}

// `GET /event/list` é público e devolve o que já foi publicado e o que já
// aconteceu, da data mais recente para a mais antiga. O recorte entre "próximo"
// e "realizado" é decisão de tela, não de rota, e por isso acontece aqui: a
// agenda mostra os dois grupos e a home só o primeiro.
export async function listEvents(limit = 50): Promise<EventList> {
  const { data } = await api.get<ListEventsResponse>("/event/list", { params: { limit } })

  return {
    events: data.events.map((event) => ({ ...event, image: resolveEventImage(event.slug) })),
    total: data.total,
  }
}

export function isUpcoming(event: Event, reference = new Date()): boolean {
  // Um evento de três noites continua "próximo" até a última delas terminar.
  const ends = event.ends_at ?? event.starts_at

  return event.status === "published" && new Date(ends).getTime() >= reference.getTime()
}

export function byStartDate(direction: "asc" | "desc") {
  return function compare(left: Event, right: Event) {
    const difference = new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime()

    return direction === "asc" ? difference : -difference
  }
}
