// Espelha os domínios `volunteer` e `volunteer-shift` do backend: o cadastro de
// quem doa tempo, a escala que a coordenação abre e a presença que ela fecha.

export type VolunteerArea = "ambulatorio" | "escola" | "oficina" | "eventos" | "comunicacao" | "administrativo" | "outra"

export type VolunteerPeriod = "manha" | "tarde" | "noite" | "fim-de-semana"

export type VolunteerStatus = "pending" | "approved" | "refused"

export type VolunteerRegistration = {
  id: string
  user_id: string
  phone: string
  city: string | null
  area: VolunteerArea
  availability: VolunteerPeriod[]
  about: string
  status: VolunteerStatus
  review_note: string | null
  reviewed_at: string | null
  created_at: string
}

export type VolunteerSummary = {
  /** Horas validadas pela coordenação, DECIMAL como string. */
  hours_total: string
  hours_this_month: string
  /** Turnos ainda por vir em que a pessoa está, confirmada ou aguardando. */
  upcoming_shifts: number
  /** A aprovação do cadastro. `null` enquanto ele não foi aprovado. */
  member_since: string | null
}

export type VolunteerProfile = VolunteerRegistration & {
  user: { id: string; name: string; email: string }
  summary: VolunteerSummary
}

export type ShiftStatus = "open" | "cancelled"

export type VolunteerShift = {
  id: string
  /** A atividade em si: "Apoio na Oficina Terapêutica". */
  activity: string
  area: VolunteerArea
  /** Onde acontece, no nome que a associação usa internamente. */
  place: string
  /** Quem coordena o turno e responde pela presença. */
  coordinator: string
  description: string | null
  starts_at: string
  ends_at: string
  slots: number
  taken_slots: number
  status: ShiftStatus
}

export type AssignmentStatus = "pending" | "confirmed" | "attended" | "absent" | "cancelled"

export type VolunteerAssignment = {
  id: string
  shift_id: string
  volunteer_id: string
  status: AssignmentStatus
  /** Horas validadas, só na presença registrada. */
  hours: string | null
  checked_at: string | null
}

/** Um turno aberto como o voluntário o vê, com as vagas e a própria situação. */
export type OpenShift = VolunteerShift & {
  free_slots: number
  my_status: Exclude<AssignmentStatus, "cancelled"> | null
}

/** Um turno da escala de quem está no painel. */
export type MyAssignment = VolunteerAssignment & { shift: VolunteerShift }

/** Um turno como a coordenação o vê, com quem se ofereceu. */
export type CoordinatedShift = VolunteerShift & {
  assignments: (VolunteerAssignment & {
    volunteer: {
      id: string
      phone: string
      area: VolunteerArea
      user: { id: string; name: string; email: string }
    }
  })[]
}

export type VolunteerApplication = VolunteerRegistration & {
  user: { id: string; name: string; email: string }
  reviewer: { id: string; name: string } | null
  hours_total: string
}

export type VolunteerApplicationPage = {
  volunteers: VolunteerApplication[]
  total: number
  pending: number
}

export type VolunteerSignupInput = {
  name: string
  email: string
  password: string
  phone: string
  city: string | null
  area: VolunteerArea
  availability: VolunteerPeriod[]
  about: string
}

export type ShiftInput = {
  activity: string
  area: VolunteerArea
  place: string
  coordinator: string
  description: string | null
  starts_at: string
  ends_at: string
  slots: number
}
