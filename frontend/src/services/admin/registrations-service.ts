import axios from "axios"
import { api } from "../../config/api"
import { CheckoutError } from "../../config/errors"
import type { Registration, RegistrationList } from "../../types/registration-types"

// A lista de presença vem inteira, em ordem alfabética: é assim que a portaria
// procura um nome, e a busca acontece na tela sem nova chamada.
export async function listRegistrations(eventId: string): Promise<RegistrationList> {
  const { data } = await api.get<RegistrationList>(`/registration/list/${encodeURIComponent(eventId)}`, {
    params: { limit: 1000 },
  })

  return { event: data.event, registrations: data.registrations, total: data.total, summary: data.summary }
}

// O evento vai junto do código: a portaria trabalha uma noite por vez, e um
// ingresso válido de outro evento não entra só por existir.
export async function checkIn({ eventId, code }: { eventId: string; code: string }): Promise<Registration> {
  try {
    const { data } = await api.patch<{ registration: Registration }>(`/registration/check-in/${encodeURIComponent(code)}`, {
      event_id: eventId,
    })

    return data.registration
  } catch (error: unknown) {
    throw refusal(error, "A entrada não foi registrada. O ingresso pode ter acabado de entrar por outra porta, ou a inscrição foi cancelada.")
  }
}

export async function undoCheckIn(id: string): Promise<Registration> {
  try {
    const { data } = await api.patch<{ registration: Registration }>(`/registration/undo-check-in/${encodeURIComponent(id)}`)

    return data.registration
  } catch (error: unknown) {
    throw refusal(error, "A entrada não pôde ser desfeita. Ela já tinha sido desfeita por outra pessoa.")
  }
}

// Só a inscrição gratuita. O convite pago sai por estorno, no Financeiro, que
// devolve o dinheiro e cancela a inscrição junto.
export async function cancelRegistration(id: string): Promise<Registration> {
  try {
    const { data } = await api.patch<{ registration: Registration }>(`/registration/cancel/${encodeURIComponent(id)}`)

    return data.registration
  } catch (error: unknown) {
    throw refusal(error, "A inscrição não pôde ser cancelada. Ela já entrou no evento ou já tinha sido cancelada.")
  }
}

// As recusas viram frases da portaria, em português. A tela já confere o
// estado da lista antes de chamar, então um 400 aqui é quase sempre corrida
// entre duas pessoas mexendo no mesmo ingresso, e a lista é recarregada.
function refusal(error: unknown, refused: string): unknown {
  if (axios.isAxiosError(error) && error.response) {
    if (error.response.status === 404) {
      return new CheckoutError("Nenhuma inscrição tem este código.")
    }

    if (error.response.status === 400) {
      return new CheckoutError(refused)
    }
  }

  return error
}
