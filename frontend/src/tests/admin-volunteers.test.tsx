import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import AdminVolunteersPage from "../pages/admin/admin-volunteers-page"
import VolunteerScalePage from "../pages/admin/volunteer-scale-page"
import type { User } from "../types/user-types"
import type { CoordinatedShift, VolunteerApplication } from "../types/volunteer-types"
import { renderWithProviders } from "./utils/render-with-providers"

const { getProfile, listVolunteers, reviewVolunteer, listShifts, reviewAssignment, recordAttendance } = vi.hoisted(() => ({
  getProfile: vi.fn(),
  listVolunteers: vi.fn(),
  reviewVolunteer: vi.fn(),
  listShifts: vi.fn(),
  reviewAssignment: vi.fn(),
  recordAttendance: vi.fn(),
}))

vi.mock("../services/auth/get-profile-service", () => ({ getProfile }))

vi.mock("../services/admin/volunteers-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  listVolunteers,
  reviewVolunteer,
  listShifts,
  reviewAssignment,
  recordAttendance,
}))

function at(days: number, hour: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

const CAMILA: VolunteerApplication = {
  id: "volunteer-7",
  user_id: "user-7",
  phone: "19 99618-2307",
  city: "Indaiatuba",
  area: "oficina",
  availability: ["tarde"],
  about: "Faço artesanato há muitos anos e gostaria de ensinar nas oficinas.",
  status: "pending",
  review_note: null,
  reviewed_at: null,
  created_at: "2026-10-20T12:00:00.000Z",
  user: { id: "user-7", name: "Camila Rocha", email: "camila.rocha@exemplo.com.br" },
  reviewer: null,
  hours_total: "0.00",
}

function person(id: string, name: string, status: CoordinatedShift["assignments"][number]["status"]): CoordinatedShift["assignments"][number] {
  return {
    id,
    shift_id: "shift-1",
    volunteer_id: `volunteer-${id}`,
    status,
    hours: null,
    checked_at: null,
    volunteer: { id: `volunteer-${id}`, phone: "19 99000-0000", area: "eventos", user: { id: `user-${id}`, name, email: `${id}@exemplo.com.br` } },
  }
}

function shift(overrides: Partial<CoordinatedShift>): CoordinatedShift {
  return {
    id: "shift-1",
    activity: "Montagem do bazar beneficente",
    area: "eventos",
    place: "Sede administrativa",
    coordinator: "Coordenação de Captação",
    description: null,
    starts_at: at(9, 9),
    ends_at: at(9, 12),
    slots: 4,
    taken_slots: 2,
    status: "open",
    assignments: [person("a1", "Ana Vieira", "pending"), person("a2", "Pedro Henrique Lima", "confirmed")],
    ...overrides,
  }
}

function signedIn() {
  const user: User = {
    id: "user-communication",
    name: "Comunicação Somos do Bem",
    email: "comunicacao@somosdobem.org.br",
    role: "communication",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  }

  window.localStorage.setItem("somosdobem.token", "token-de-teste")
  getProfile.mockResolvedValue(user)
}

describe("coordenação do voluntariado", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signedIn()
    listVolunteers.mockResolvedValue({ volunteers: [CAMILA], total: 1, pending: 1 })
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it("aprova um cadastro e põe a pessoa na escala", async () => {
    const user = userEvent.setup()
    reviewVolunteer.mockResolvedValue(undefined)

    renderWithProviders(<AdminVolunteersPage />, "/admin/voluntariado/cadastros")

    expect(await screen.findByRole("heading", { name: "Camila Rocha" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /^aprovar$/i }))
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: /aprovar cadastro/i }))

    await waitFor(() => expect(reviewVolunteer).toHaveBeenCalledTimes(1))
    expect(reviewVolunteer.mock.calls[0][0]).toEqual({ id: "volunteer-7", decision: "approved", note: null })
    expect(await screen.findByText(/camila rocha entrou na escala/i)).toBeInTheDocument()
  })

  it("confirma quem se ofereceu antes do turno, e não oferece presença ainda", async () => {
    const user = userEvent.setup()
    listShifts.mockResolvedValue([shift({})])
    reviewAssignment.mockResolvedValue(undefined)

    renderWithProviders(<VolunteerScalePage />, "/admin/voluntariado/escala")

    const people = await screen.findByRole("list", { name: /voluntários de montagem do bazar/i })
    expect(within(people).queryByRole("button", { name: /presente/i })).not.toBeInTheDocument()

    await user.click(within(people).getByRole("button", { name: /^confirmar$/i }))

    await waitFor(() => expect(reviewAssignment).toHaveBeenCalledTimes(1))
    expect(reviewAssignment.mock.calls[0][0]).toEqual({ id: "a1", decision: "confirmed" })
  })

  it("registra a presença depois do turno com a duração dele como horas", async () => {
    const user = userEvent.setup()
    listShifts.mockResolvedValue([shift({ starts_at: at(-1, 9), ends_at: at(-1, 12) })])
    recordAttendance.mockResolvedValue(undefined)

    renderWithProviders(<VolunteerScalePage />, "/admin/voluntariado/escala")

    const people = await screen.findByRole("list", { name: /voluntários de montagem do bazar/i })
    expect(within(people).queryByRole("button", { name: /^confirmar$/i })).not.toBeInTheDocument()

    await user.click(within(people).getAllByRole("button", { name: /presente/i })[0])

    const dialog = screen.getByRole("dialog", { name: /presença de ana vieira/i })
    expect(within(dialog).getByLabelText(/horas no turno/i)).toHaveValue("3")

    await user.click(within(dialog).getByRole("button", { name: /registrar presença/i }))

    await waitFor(() => expect(recordAttendance).toHaveBeenCalledTimes(1))
    expect(recordAttendance.mock.calls[0][0]).toEqual({ id: "a1", attended: true, hours: 3 })
  })
})
