import axios from "axios"
import { api } from "../../config/api"
import { NotFoundError } from "../../config/errors"
import type { ApiEvent, Event } from "../../types/event-types"
import { resolveEventImage } from "./event-image"

type GetEventResponse = {
  event: ApiEvent
}

// O 404 vira erro de domínio: "não existe esse evento" é uma resposta legítima,
// com tela própria, e não uma falha de serviço. A tela decide por `instanceof`.
export async function getEventBySlug(slug: string): Promise<Event> {
  try {
    const { data } = await api.get<GetEventResponse>(`/event/${encodeURIComponent(slug)}`)

    return { ...data.event, image: resolveEventImage(data.event.slug) }
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new NotFoundError("Evento não encontrado")
    }

    throw error
  }
}
