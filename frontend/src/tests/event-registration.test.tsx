import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CheckoutError, NotFoundError } from "../config/errors"
import EventPage from "../pages/public/event-page"
import TicketPage from "../pages/public/ticket-page"
import type { Event } from "../types/event-types"
import type { Ticket } from "../types/registration-types"
import type { User } from "../types/user-types"
import { fillField } from "./utils/fill-field"
import { renderWithProviders } from "./utils/render-with-providers"

const mocks = vi.hoisted(() => ({
  getEventBySlug: vi.fn(),
  createRegistration: vi.fn(),
  getTicket: vi.fn(),
  checkIn: vi.fn(),
  getProfile: vi.fn(),
}))

vi.mock("../services/event/get-event-by-slug-service", () => ({ getEventBySlug: mocks.getEventBySlug }))
vi.mock("../services/registration/registration-service", () => ({
  createRegistration: mocks.createRegistration,
  getTicket: mocks.getTicket,
}))
vi.mock("../services/admin/registrations-service", () => ({
  checkIn: mocks.checkIn,
  undoCheckIn: vi.fn(),
  cancelRegistration: vi.fn(),
  listRegistrations: vi.fn(),
}))
vi.mock("../services/auth/get-profile-service", () => ({ getProfile: mocks.getProfile }))

const FREE: Event = {
  id: "44444444-4444-4444-8444-444444444444",
  campaign_id: null,
  title: "Dia de Portas Abertas",
  slug: "dia-de-portas-abertas",
  description: "Visita guiada pelo Ambulatório e pela Oficina Terapêutica.",
  location: "Sede da Somos do Bem, Indaiatuba",
  starts_at: "2099-10-27T12:00:00.000Z",
  ends_at: "2099-10-27T15:00:00.000Z",
  ticket_price: "0.00",
  capacity: 80,
  taken_seats: 33,
  status: "published",
  image_url: null,
  image: null,
}

function ticket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: "registration-1",
    ticket_code: "7KQ2M-X9D4R",
    participant_name: "Maria Oliveira",
    status: "confirmed",
    paid: false,
    checked_in_at: null,
    event: {
      id: FREE.id,
      title: FREE.title,
      slug: FREE.slug,
      location: FREE.location,
      starts_at: FREE.starts_at,
      ends_at: FREE.ends_at,
      status: "published",
    },
    qr: "data:image/svg+xml;base64,PHN2Zy8+",
    ...overrides,
  }
}

function journey(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/eventos/:slug" element={<EventPage />} />
      <Route path="/inscricao/:codigo" element={<TicketPage />} />
    </Routes>,
    route,
  )
}

describe("inscrição em evento gratuito", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getEventBySlug.mockResolvedValue(FREE)
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it("inscreve a pessoa e leva direto ao ingresso com o QR da entrada", async () => {
    const user = userEvent.setup()
    mocks.createRegistration.mockResolvedValue({
      id: "registration-1",
      ticket_code: "7KQ2M-X9D4R",
      participant_name: "Maria Oliveira",
      status: "confirmed",
      event: { title: FREE.title, slug: FREE.slug, starts_at: FREE.starts_at },
    })
    mocks.getTicket.mockResolvedValue(ticket())

    journey("/eventos/dia-de-portas-abertas")

    await screen.findByRole("heading", { name: /entrada gratuita, com inscrição/i })
    await fillField(user, /nome de quem vai participar/i, "Maria Oliveira")
    await fillField(user, /^e-mail/i, "maria@exemplo.com.br")
    await user.click(screen.getByRole("button", { name: /fazer minha inscrição/i }))

    await waitFor(() => expect(mocks.createRegistration).toHaveBeenCalledTimes(1))
    expect(mocks.createRegistration.mock.calls[0][0]).toEqual({
      event_id: FREE.id,
      participant_name: "Maria Oliveira",
      participant_email: "maria@exemplo.com.br",
      participant_phone: null,
    })

    expect(await screen.findByRole("img", { name: /qr do ingresso 7KQ2M-X9D4R/i })).toBeInTheDocument()
    expect(mocks.getTicket).toHaveBeenCalledWith("7KQ2M-X9D4R")
    expect(screen.getByText("Maria Oliveira")).toBeInTheDocument()
    expect(screen.getByText(/inscrição confirmada/i)).toBeInTheDocument()

    // Visitante não registra entrada: o botão da portaria é da equipe.
    expect(screen.queryByRole("button", { name: /registrar entrada/i })).not.toBeInTheDocument()
  })

  it("explica a recusa e mantém a pessoa na página do evento", async () => {
    const user = userEvent.setup()
    mocks.createRegistration.mockRejectedValue(
      new CheckoutError("A inscrição não foi concluída. As vagas podem ter acabado agora, ou já existe uma inscrição com este nome e e-mail neste evento."),
    )

    journey("/eventos/dia-de-portas-abertas")

    await screen.findByRole("heading", { name: /entrada gratuita, com inscrição/i })
    await fillField(user, /nome de quem vai participar/i, "Maria Oliveira")
    await fillField(user, /^e-mail/i, "maria@exemplo.com.br")
    await user.click(screen.getByRole("button", { name: /fazer minha inscrição/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/já existe uma inscrição com este nome e e-mail/i)
    expect(screen.getByLabelText(/nome de quem vai participar/i)).toHaveValue("Maria Oliveira")
    expect(mocks.getTicket).not.toHaveBeenCalled()
  })

  it("deixa a equipe registrar a entrada pela própria página do ingresso", async () => {
    const user = userEvent.setup()
    const staff: User = {
      id: "user-communication",
      name: "Comunicação Somos do Bem",
      email: "comunicacao@somosdobem.org.br",
      role: "communication",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    }
    window.localStorage.setItem("somosdobem.token", "token-de-teste")
    mocks.getProfile.mockResolvedValue(staff)
    mocks.getTicket.mockResolvedValue(ticket())
    mocks.checkIn.mockResolvedValue({})

    journey("/inscricao/7KQ2M-X9D4R")

    await user.click(await screen.findByRole("button", { name: /registrar entrada de maria oliveira/i }))

    await waitFor(() => expect(mocks.checkIn).toHaveBeenCalledWith({ eventId: FREE.id, code: "7KQ2M-X9D4R" }, expect.anything()))
  })

  it("responde que o ingresso não existe para um código desconhecido", async () => {
    mocks.getTicket.mockRejectedValue(new NotFoundError("Ingresso não encontrado"))

    journey("/inscricao/AAAAA-BBBBB")

    expect(await screen.findByText(/ingresso não encontrado/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /ver a agenda/i })).toBeInTheDocument()
  })
})
