// Escala e horas de quem doa tempo. O formato é o que a vertical de voluntariado
// do backend vai devolver, então ligá-la depois é uma mudança de `services/`,
// sem tocar na tela.

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
