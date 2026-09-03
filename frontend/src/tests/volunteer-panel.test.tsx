import { screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { RequireRole } from "../components/auth/require-role"
import VolunteerPanelPage from "../pages/volunteer/volunteer-panel-page"
import type { Event } from "../types/event-types"
import type { User, UserRole } from "../types/user-types"
import { renderWithProviders } from "./utils/render-with-providers"

const { getProfile, listEvents } = vi.hoisted(() => ({
  getProfile: vi.fn(),
  listEvents: vi.fn(),
}))

vi.mock("../services/auth/get-profile-service", () => ({ getProfile }))

vi.mock("../services/event/list-events-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  listEvents,
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

function futureEvent(): Event {
  const starts = new Date()
  starts.setDate(starts.getDate() + 15)

  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    campaign_id: null,
    title: "Chefs do Bem, 6ª edição",
    slug: "chefs-do-bem-6a-edicao",
    description: "Jantar beneficente.",
    location: "Espaço Viber, Indaiatuba",
    starts_at: starts.toISOString(),
    ends_at: null,
    ticket_price: "180.00",
    capacity: 200,
    taken_seats: 40,
    status: "published",
    image: null,
  }
}

function signedInAs(role: UserRole) {
  window.localStorage.setItem("somosdobem.token", "token-de-teste")
  getProfile.mockResolvedValue(profile(role))
}

describe("painel do voluntariado", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listEvents.mockResolvedValue({ events: [futureEvent()], total: 1 })
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  // O módulo é um protótipo: a escala é simulada e os eventos são reais. Dizer
  // isso em voz alta é requisito, e não enfeite. Um painel que mostra hora e
  // presença sem avisar acaba virando comprovante na mão de alguém.
  it("avisa que a agenda é simulada e ainda assim mostra os eventos reais", async () => {
    signedInAs("volunteer")

    renderWithProviders(
      <RequireRole roles={["volunteer", "admin"]}>
        <VolunteerPanelPage />
      </RequireRole>,
      "/voluntario/painel",
    )

    expect(await screen.findByRole("heading", { name: /olá, joana/i })).toBeInTheDocument()
    expect(screen.getByText(/módulo em construção/i)).toBeInTheDocument()
    expect(screen.getByText(/dados de demonstração/i)).toBeInTheDocument()

    expect(await screen.findByText(/chefs do bem/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /ver o evento/i })).toHaveAttribute(
      "href",
      "/eventos/chefs-do-bem-6a-edicao",
    )
  })

  it("recusa o painel para quem é do financeiro, sem mandar ao login de novo", async () => {
    signedInAs("finance")

    renderWithProviders(
      <RequireRole roles={["volunteer", "admin"]}>
        <VolunteerPanelPage />
      </RequireRole>,
      "/voluntario/painel",
    )

    expect(await screen.findByRole("heading", { name: /esta tela não é do seu perfil/i })).toBeInTheDocument()
    expect(screen.queryByText(/módulo em construção/i)).not.toBeInTheDocument()
  })
})
