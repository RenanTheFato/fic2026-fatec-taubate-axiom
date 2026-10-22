import type { AssignmentStatus, VolunteerArea, VolunteerPeriod, VolunteerStatus } from "../../types/volunteer-types"
import type { BadgeTone } from "../ui/badge"

// As frentes, os períodos e as situações do voluntariado, com a mesma palavra
// no cadastro do site, no painel do voluntário e no painel da coordenação. As
// chaves espelham `VOLUNTEER_AREAS` e `VOLUNTEER_PERIODS` do backend.

export const AREA_LABEL: Record<VolunteerArea, string> = {
  ambulatorio: "Ambulatório, apoio ao atendimento",
  escola: "Escola de Educação Especial",
  oficina: "Programa de Oficina Terapêutica",
  eventos: "Eventos e campanhas",
  comunicacao: "Comunicação e captação",
  administrativo: "Administrativo",
  outra: "Outra área",
}

export const AREAS = Object.keys(AREA_LABEL) as VolunteerArea[]

export const PERIOD_LABEL: Record<VolunteerPeriod, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  "fim-de-semana": "Fim de semana",
}

export const PERIODS = Object.keys(PERIOD_LABEL) as VolunteerPeriod[]

export const VOLUNTEER_STATUS: Record<VolunteerStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Em análise", tone: "reward" },
  approved: { label: "Aprovado", tone: "success" },
  refused: { label: "Recusado", tone: "primary" },
}

export const ASSIGNMENT_STATUS: Record<AssignmentStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Aguardando confirmação", tone: "reward" },
  confirmed: { label: "Confirmado", tone: "success" },
  attended: { label: "Realizado", tone: "institutional" },
  absent: { label: "Falta", tone: "primary" },
  cancelled: { label: "Cancelado", tone: "institutional" },
}

/** "3 h" ou "2,5 h": a hora validada como a coordenação a registrou. */
export function formatHours(hours: string | number): string {
  const value = typeof hours === "number" ? hours : Number(hours)

  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value)} h`
}
