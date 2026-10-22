import axios from "axios"
import { api } from "../../config/api"
import { CheckoutError, NotFoundError } from "../../config/errors"
import type {
  MyAssignment,
  OpenShift,
  VolunteerArea,
  VolunteerPeriod,
  VolunteerProfile,
  VolunteerShift,
  VolunteerSignupInput,
} from "../../types/volunteer-types"

// O lado de quem doa tempo: o cadastro feito pelo site, o painel com as horas,
// a escala própria e os turnos abertos.

const REFUSALS: Record<string, string> = {
  "Email is already in use": "Este e-mail já tem uma conta. Entre com ele para acompanhar o cadastro.",
  "The shift has no slots left": "As vagas deste turno acabaram de ser preenchidas.",
  "This shift has already started": "Este turno já começou.",
  "You are already on this shift": "Você já está neste turno.",
  "Only an approved volunteer can join a shift": "Os turnos abrem depois que a coordenação aprova o cadastro.",
  "Only a refused registration can be sent again": "Só um cadastro recusado pode ser enviado de novo.",
  "The attendance of this shift has already been recorded": "A presença deste turno já foi registrada.",
}

function refusal(error: unknown, fallback: string): unknown {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data as { error?: string } | undefined

    if (error.response.status === 400 || error.response.status === 403 || error.response.status === 404) {
      return new CheckoutError((data?.error && REFUSALS[data.error]) || fallback)
    }
  }

  return error
}

export async function applyVolunteer(input: VolunteerSignupInput): Promise<void> {
  try {
    await api.post("/volunteer/apply", input)
  } catch (error: unknown) {
    throw refusal(error, "Algum campo não foi aceito. Confira os dados e tente de novo.")
  }
}

type ProfileResponse = { volunteer: VolunteerProfile }

// Uma conta de voluntário criada antes do cadastro (pelo login antigo, por
// exemplo) responde 404: a tela diz que falta o cadastro, e não que falhou.
export async function getVolunteerProfile(): Promise<VolunteerProfile> {
  try {
    const { data } = await api.get<ProfileResponse>("/volunteer/profile")

    return data.volunteer
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new NotFoundError("Cadastro de voluntariado não encontrado")
    }

    throw error
  }
}

export async function resubmitVolunteer(input: { area: VolunteerArea; availability: VolunteerPeriod[]; about: string }): Promise<void> {
  try {
    await api.patch("/volunteer/resubmit", input)
  } catch (error: unknown) {
    throw refusal(error, "O cadastro não foi reenviado. Confira os campos e tente de novo.")
  }
}

type OpenShiftsResponse = { shifts: OpenShift[] }

export async function listOpenShifts(): Promise<OpenShift[]> {
  const { data } = await api.get<OpenShiftsResponse>("/volunteer-shift/open")

  return data.shifts
}

type MyShiftsResponse = { assignments: MyAssignment[] }

export async function listMyShifts(): Promise<MyAssignment[]> {
  const { data } = await api.get<MyShiftsResponse>("/volunteer-shift/mine")

  return data.assignments
}

export async function joinShift(id: string): Promise<void> {
  try {
    await api.post(`/volunteer-shift/join/${encodeURIComponent(id)}`)
  } catch (error: unknown) {
    throw refusal(error, "Não deu para entrar no turno agora.")
  }
}

export async function leaveShift(id: string): Promise<void> {
  try {
    await api.patch(`/volunteer-shift/leave/${encodeURIComponent(id)}`)
  } catch (error: unknown) {
    throw refusal(error, "Não deu para sair do turno agora.")
  }
}

/** Turnos que ainda vão acontecer, do mais próximo para o mais distante. */
export function upcomingAssignments(assignments: MyAssignment[], reference = new Date()): MyAssignment[] {
  return assignments
    .filter((assignment) => new Date(assignment.shift.starts_at).getTime() >= reference.getTime())
    .sort((a, b) => new Date(a.shift.starts_at).getTime() - new Date(b.shift.starts_at).getTime())
}

/** Turnos que já começaram, do mais recente para o mais antigo. */
export function pastAssignments(assignments: MyAssignment[], reference = new Date()): MyAssignment[] {
  return assignments
    .filter((assignment) => new Date(assignment.shift.starts_at).getTime() < reference.getTime())
    .sort((a, b) => new Date(b.shift.starts_at).getTime() - new Date(a.shift.starts_at).getTime())
}

/** O turno já começou: a partir daí ninguém sai dele, e a coordenação registra a presença. */
export function hasStarted(shift: Pick<VolunteerShift, "starts_at">, reference = new Date()): boolean {
  return new Date(shift.starts_at).getTime() <= reference.getTime()
}

/** "14h às 17h", na hora local de quem lê. */
export function shiftTime(shift: Pick<VolunteerShift, "starts_at" | "ends_at">): string {
  const format = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" })

  return `${format.format(new Date(shift.starts_at))} às ${format.format(new Date(shift.ends_at))}`
}
