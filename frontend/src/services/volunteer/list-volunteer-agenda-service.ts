import type { VolunteerShift, VolunteerSummary } from "../../types/volunteer-types"

// SIMULADO. Não existe rota de voluntariado no backend, e este arquivo é o único
// lugar do frontend que sabe disso. A tela consome estas funções pelo mesmo
// caminho que consumiria a API, então trocar a simulação pela vertical de
// verdade é reescrever este arquivo e nada mais.
//
// Os dados são de demonstração, e a tela diz isso em voz alta. Um protótipo que
// mostra número inventado sem avisar é pior do que um protótipo vazio: alguém
// acaba levando o número para uma reunião.

// As datas são calculadas a partir de "hoje" para a agenda nunca aparecer
// vencida numa demonstração feita meses depois de o código ser escrito.
function at(dayOffset: number, hour: number, minute = 0): string {
  const date = new Date()

  date.setDate(date.getDate() + dayOffset)
  date.setHours(hour, minute, 0, 0)

  return date.toISOString()
}

const AGENDA: VolunteerShift[] = [
  {
    id: "turno-1",
    activity: "Apoio na Oficina Terapêutica",
    place: "Oficina Terapêutica",
    starts_at: at(2, 14),
    ends_at: at(2, 17),
    status: "confirmed",
    coordinator: "Coordenação da Oficina",
  },
  {
    id: "turno-2",
    activity: "Recepção no Dia de Portas Abertas",
    place: "Ambulatório",
    starts_at: at(5, 9),
    ends_at: at(5, 13),
    status: "confirmed",
    coordinator: "Coordenação de Eventos",
  },
  {
    id: "turno-3",
    activity: "Montagem do bazar beneficente",
    place: "Sede administrativa",
    starts_at: at(9, 8, 30),
    ends_at: at(9, 12),
    status: "pending",
    coordinator: "Coordenação de Captação",
  },
  {
    id: "turno-4",
    activity: "Apoio na Escola de Educação Especial",
    place: "Escola de Educação Especial",
    starts_at: at(-3, 13),
    ends_at: at(-3, 17),
    status: "done",
    coordinator: "Coordenação Pedagógica",
  },
  {
    id: "turno-5",
    activity: "Preparo de kits para as famílias",
    place: "Sede administrativa",
    starts_at: at(-8, 9),
    ends_at: at(-8, 12),
    status: "done",
    coordinator: "Serviço Social",
  },
]

const SUMMARY: VolunteerSummary = {
  hours_this_month: 7,
  hours_total: 96,
  upcoming_shifts: 2,
  member_since: "2025-03-10T00:00:00.000Z",
}

export async function listVolunteerAgenda(): Promise<VolunteerShift[]> {
  return AGENDA
}

export async function getVolunteerSummary(): Promise<VolunteerSummary> {
  return SUMMARY
}

/** Turnos que ainda vão acontecer, do mais próximo para o mais distante. */
export function upcomingShifts(shifts: VolunteerShift[], reference = new Date()): VolunteerShift[] {
  return shifts
    .filter((shift) => new Date(shift.starts_at).getTime() >= reference.getTime())
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
}

/** Turnos já cumpridos, do mais recente para o mais antigo. */
export function pastShifts(shifts: VolunteerShift[], reference = new Date()): VolunteerShift[] {
  return shifts
    .filter((shift) => new Date(shift.starts_at).getTime() < reference.getTime())
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
}
