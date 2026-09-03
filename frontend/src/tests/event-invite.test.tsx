import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import EventPage from "../pages/public/event-page"
import type { Event } from "../types/event-types"
import { renderWithProviders } from "./utils/render-with-providers"

const { getEventBySlug } = vi.hoisted(() => ({ getEventBySlug: vi.fn() }))

vi.mock("../services/event/get-event-by-slug-service", () => ({ getEventBySlug }))

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()

  return { ...actual, useParams: () => ({ slug: "chefs-do-bem-6a-edicao" }) }
})

function event(overrides: Partial<Event> = {}): Event {
  return {
    id: "77777777-7777-4777-8777-777777777777",
    campaign_id: null,
    title: "6ª edição do Chefs do Bem",
    slug: "chefs-do-bem-6a-edicao",
    description: "Três noites de jantar beneficente com chefs convidados.",
    location: "Espaço Viber, Indaiatuba",
    // Bem no futuro, para o teste não passar a falhar quando a data chegar.
    starts_at: "2099-10-15T19:00:00.000Z",
    ends_at: "2099-10-17T23:00:00.000Z",
    ticket_price: "120.00",
    capacity: 300,
    taken_seats: 6,
    status: "published",
    image: null,
    ...overrides,
  }
}

describe("convite de evento", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Regra travada: `ConfirmTransactionService` debita a vaga em unidade, então
  // comprar três convites ocuparia uma vaga só. A interface não expõe um defeito
  // já mapeado. Enquanto o backend não mudar, este teste tem que continuar
  // passando.
  it("não oferece seletor de quantidade", async () => {
    getEventBySlug.mockResolvedValue(event())

    renderWithProviders(<EventPage />, "/eventos/chefs-do-bem-6a-edicao")

    expect(await screen.findByRole("heading", { name: /garanta seu convite/i })).toBeInTheDocument()
    expect(screen.getByText(/um convite por pedido/i)).toBeInTheDocument()

    expect(screen.queryByLabelText(/quantidade/i)).not.toBeInTheDocument()
    expect(screen.queryByRole("spinbutton", { name: /quantidade/i })).not.toBeInTheDocument()
  })

  it("fecha a compra quando o evento lotou e oferece a doação no lugar", async () => {
    getEventBySlug.mockResolvedValue(event({ capacity: 300, taken_seats: 300 }))

    renderWithProviders(<EventPage />, "/eventos/chefs-do-bem-6a-edicao")

    expect(await screen.findByText(/convites esgotados/i)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /ir para o pagamento/i })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: /doar para a causa/i })).toBeInTheDocument()
  })

  // Evento gratuito não vai ao checkout: o backend recusa uma cobrança de zero,
  // e cobrar zero não faria sentido de qualquer forma.
  it("não manda um evento gratuito para o pagamento", async () => {
    getEventBySlug.mockResolvedValue(event({ ticket_price: "0.00" }))

    renderWithProviders(<EventPage />, "/eventos/chefs-do-bem-6a-edicao")

    // "Entrada gratuita" aparece duas vezes de propósito: no selo do topo e no
    // bloco que explica por que não há checkout.
    expect(await screen.findAllByText(/entrada gratuita/i)).not.toHaveLength(0)
    expect(screen.getByText(/reservar seu lugar/i)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /ir para o pagamento/i })).not.toBeInTheDocument()
  })
})
