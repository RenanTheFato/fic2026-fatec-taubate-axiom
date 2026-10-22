import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { RequireRole } from "../components/auth/require-role"
import VolunteerPanelPage from "../pages/volunteer/volunteer-panel-page"
import type { User, UserRole } from "../types/user-types"
import type { MyAssignment, OpenShift, VolunteerProfile, VolunteerShift } from "../types/volunteer-types"
import { renderWithProviders } from "./utils/render-with-providers"

const { getProfile, getVolunteerProfile, listMyShifts, listOpenShifts, joinShift } = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getVolunteerProfile: vi.fn(),
  listMyShifts: vi.fn(),
  listOpenShifts: vi.fn(),
  joinShift: vi.fn(),
}))

vi.mock("../services/auth/get-profile-service", () => ({ getProfile }))

vi.mock("../services/volunteer/volunteer-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getVolunteerProfile,
  listMyShifts,
  listOpenShifts,
  joinShift,
}))

function profile(role: UserRole): User {
  return {
    id: "99999999-9999-4999-8999-999999999999",
    name: "Joana Ribeiro",
    email: "joana@somosdobem.org.br",
    role,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  }
}

function at(days: number, hour: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

function shift(overrides: Partial<VolunteerShift> = {}): VolunteerShift {
  return {
    id: "shift-1",
    activity: "Apoio na Oficina Terapêutica",
    area: "oficina",
    place: "Oficina Terapêutica",
    coordinator: "Coordenação da Oficina",
    description: null,
    starts_at: at(2, 14),
    ends_at: at(2, 17),
    slots: 3,
    taken_slots: 1,
    status: "open",
    ...overrides,
  }
}

function registration(status: VolunteerProfile["status"]): VolunteerProfile {
  return {
    id: "volunteer-1",
    user_id: "99999999-9999-4999-8999-999999999999",
    phone: "19 99654-2210",
    city: "Indaiatuba",
    area: "oficina",
    availability: ["tarde"],
    about: "Quero ajudar nas oficinas da associação.",
    status,
    review_note: status === "refused" ? "Hoje a escola não tem turma no período da noite." : null,
    reviewed_at: status === "pending" ? null : "2025-03-09T16:00:00.000Z",
    created_at: "2025-03-07T12:00:00.000Z",
    user: { id: "99999999-9999-4999-8999-999999999999", name: "Joana Ribeiro", email: "joana@somosdobem.org.br" },
    summary: { hours_total: "14.00", hours_this_month: "8.00", upcoming_shifts: 1, member_since: status === "approved" ? "2025-03-09T16:00:00.000Z" : null },
  }
}

const MINE: MyAssignment[] = [
  { id: "a-1", shift_id: "shift-1", volunteer_id: "volunteer-1", status: "confirmed", hours: null, checked_at: null, shift: shift() },
  {
    id: "a-0",
    shift_id: "shift-0",
    volunteer_id: "volunteer-1",
    status: "attended",
    hours: "4.00",
    checked_at: at(-5, 17),
    shift: shift({ id: "shift-0", activity: "Recepção no Bazar Solidário", starts_at: at(-5, 9), ends_at: at(-5, 13) }),
  },
]

const OPEN: OpenShift[] = [
  { ...shift(), my_status: "confirmed", free_slots: 2 },
  { ...shift({ id: "shift-2", activity: "Montagem do bazar beneficente", area: "eventos", starts_at: at(9, 8), ends_at: at(9, 12) }), my_status: null, free_slots: 3 },
]

function signedInAs(role: UserRole) {
  window.localStorage.setItem("somosdobem.token", "token-de-teste")
  getProfile.mockResolvedValue(profile(role))
}

function renderPanel() {
  return renderWithProviders(
    <RequireRole roles={["volunteer"]}>
      <VolunteerPanelPage />
    </RequireRole>,
    "/voluntario/painel",
  )
}

describe("painel do voluntariado", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listMyShifts.mockResolvedValue(MINE)
    listOpenShifts.mockResolvedValue(OPEN)
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it("mostra as horas validadas, a escala, os turnos abertos e o histórico", async () => {
    signedInAs("volunteer")
    getVolunteerProfile.mockResolvedValue(registration("approved"))

    renderPanel()

    expect(await screen.findByRole("heading", { name: /olá, joana/i })).toBeInTheDocument()
    expect(await screen.findByText("8 h")).toBeInTheDocument()
    expect(screen.getByText("14 h")).toBeInTheDocument()

    const next = screen.getByRole("heading", { name: /seus próximos turnos/i }).closest("section") as HTMLElement
    expect(await within(next).findByText("Apoio na Oficina Terapêutica")).toBeInTheDocument()

    const history = (await screen.findByRole("heading", { name: /o que você já fez/i })).closest("section") as HTMLElement
    expect(within(history).getByText("Recepção no Bazar Solidário")).toBeInTheDocument()
    expect(within(history).getByText("4 h")).toBeInTheDocument()
  })

  it("entra num turno aberto e avisa que a coordenação confirma", async () => {
    const user = userEvent.setup()
    signedInAs("volunteer")
    getVolunteerProfile.mockResolvedValue(registration("approved"))
    joinShift.mockResolvedValue(undefined)

    renderPanel()

    const open = (await screen.findByRole("heading", { name: /turnos abertos/i })).closest("section") as HTMLElement
    const buttons = await within(open).findAllByRole("button", { name: /quero participar/i })

    // O turno em que a pessoa já está não oferece o botão de novo.
    expect(buttons).toHaveLength(1)

    await user.click(buttons[0])

    expect(joinShift.mock.calls[0][0]).toBe("shift-2")
    expect(await screen.findByText(/a coordenação confirma a sua participação/i)).toBeInTheDocument()
  })

  it("mostra o cadastro em análise sem perguntar pelos turnos abertos", async () => {
    signedInAs("volunteer")
    getVolunteerProfile.mockResolvedValue(registration("pending"))

    renderPanel()

    expect(await screen.findByText(/seu cadastro está em análise/i)).toBeInTheDocument()
    expect(listOpenShifts).not.toHaveBeenCalled()
  })

  it("mostra o motivo da recusa e o caminho para mandar de novo", async () => {
    signedInAs("volunteer")
    getVolunteerProfile.mockResolvedValue(registration("refused"))

    renderPanel()

    expect(await screen.findByText(/hoje a escola não tem turma/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /enviar de novo/i })).toBeInTheDocument()
  })

  it("recusa o painel para quem é do financeiro, sem mandar ao login de novo", async () => {
    signedInAs("finance")

    renderPanel()

    expect(await screen.findByRole("heading", { name: /esta tela não é do seu perfil/i })).toBeInTheDocument()
    expect(getVolunteerProfile).not.toHaveBeenCalled()
  })
})
