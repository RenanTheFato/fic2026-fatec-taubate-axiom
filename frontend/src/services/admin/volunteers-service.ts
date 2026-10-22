import axios from "axios"
import { api } from "../../config/api"
import { CheckoutError } from "../../config/errors"
import type { CoordinatedShift, ShiftInput, VolunteerApplicationPage, VolunteerStatus } from "../../types/volunteer-types"

export const VOLUNTEERS_PER_PAGE = 20

// A coordenação do voluntariado: os cadastros, a escala e a presença. Responde a
// admin e comunicação.

export async function listVolunteers({ status, page }: { status: VolunteerStatus | null; page: number }): Promise<VolunteerApplicationPage> {
  const { data } = await api.get<VolunteerApplicationPage>("/volunteer/list", {
    params: { page, limit: VOLUNTEERS_PER_PAGE, ...(status ? { status } : {}) },
  })

  return { volunteers: data.volunteers, total: data.total, pending: data.pending }
}

export async function reviewVolunteer({ id, decision, note }: { id: string; decision: "approved" | "refused"; note: string | null }): Promise<void> {
  try {
    await api.patch(`/volunteer/review/${encodeURIComponent(id)}`, { decision, note })
  } catch (error: unknown) {
    throw refusal(error, "O cadastro não pôde ser respondido.")
  }
}

type ShiftsResponse = { shifts: CoordinatedShift[] }

export async function listShifts(scope: "upcoming" | "past"): Promise<CoordinatedShift[]> {
  const { data } = await api.get<ShiftsResponse>("/volunteer-shift/list", { params: { scope } })

  return data.shifts
}

export async function createShift(input: ShiftInput): Promise<void> {
  try {
    await api.post("/volunteer-shift/create", input)
  } catch (error: unknown) {
    throw refusal(error, "O turno não foi criado. Confira data, horário e vagas.")
  }
}

export async function cancelShift(id: string): Promise<void> {
  try {
    await api.patch(`/volunteer-shift/cancel/${encodeURIComponent(id)}`)
  } catch (error: unknown) {
    throw refusal(error, "O turno não pôde ser cancelado.")
  }
}

export async function reviewAssignment({ id, decision }: { id: string; decision: "confirmed" | "cancelled" }): Promise<void> {
  try {
    await api.patch(`/volunteer-shift/review-assignment/${encodeURIComponent(id)}`, { decision })
  } catch (error: unknown) {
    throw refusal(error, "A escala não pôde ser alterada.")
  }
}

export async function recordAttendance({ id, attended, hours }: { id: string; attended: boolean; hours: number | null }): Promise<void> {
  try {
    await api.patch(`/volunteer-shift/attendance/${encodeURIComponent(id)}`, { attended, hours })
  } catch (error: unknown) {
    throw refusal(error, "A presença não foi registrada.")
  }
}

const REFUSALS: Record<string, string> = {
  "This registration has already been reviewed": "Alguém da equipe já respondeu este cadastro. Recarregue a lista.",
  "A shift that has already started cannot be cancelled": "Este turno já começou e não pode mais ser cancelado.",
  "This shift has already started: record the attendance instead": "O turno já começou: registre presença ou falta.",
  "The attendance is recorded after the shift starts": "A presença só é registrada depois que o turno começa.",
  "This volunteer left the shift before it happened": "Esta pessoa saiu do turno antes de ele acontecer.",
}

function refusal(error: unknown, fallback: string): unknown {
  if (axios.isAxiosError(error) && error.response && (error.response.status === 400 || error.response.status === 404)) {
    const data = error.response.data as { error?: string } | undefined

    return new CheckoutError((data?.error && REFUSALS[data.error]) || fallback)
  }

  return error
}
