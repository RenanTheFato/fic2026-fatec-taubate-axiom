// O voluntariado ainda não tem vertical no backend, então estes tipos descrevem
// a forma que a API vai precisar ter, e não uma resposta que já existe. Manter o
// formato aqui desde agora faz a troca do dado simulado pelo real ser uma
// mudança de `services/`, sem mexer na tela.

export type ShiftStatus = "confirmed" | "pending" | "done"

export type VolunteerShift = {
  id: string
  /** A atividade em si: "Apoio na Oficina Terapêutica". */
  activity: string
  /** Onde acontece, no nome que a associação usa internamente. */
  place: string
  starts_at: string
  ends_at: string
  status: ShiftStatus
  /** Quem coordena o turno e responde pela presença. */
  coordinator: string
}

export type VolunteerSummary = {
  /** Horas registradas no mês corrente. */
  hours_this_month: number
  /** Horas acumuladas desde a entrada no programa. */
  hours_total: number
  /** Turnos confirmados que ainda não aconteceram. */
  upcoming_shifts: number
  /** Data de entrada no programa. */
  member_since: string
}

export const SHIFT_STATUS_LABEL: Record<ShiftStatus, string> = {
  confirmed: "Confirmado",
  pending: "Aguardando confirmação",
  done: "Realizado",
}
