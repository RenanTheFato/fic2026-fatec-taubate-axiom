import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import EventPage from "../pages/public/event-page"
import type { Event } from "../types/event-types"
import { renderWithProviders } from "./utils/render-with-providers"

const { getEventBySlug, listSupporters } = vi.hoisted(() => ({ getEventBySlug: vi.fn(), listSupporters: vi.fn() }))

vi.mock("../services/event/get-event-by-slug-service", () => ({ getEventBySlug }))

vi.mock("../services/supporter/list-supporters-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  listSupporters,
}))

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
    image_url: null,
    image: null,
    ...overrides,
  }
}

describe("convite de evento", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listSupporters.mockResolvedValue({ supporters: [{ name: "Ana Lima" }], total: 1, contributors: 3, seed: "abc123" })
  })

  it("agradece no mural quem apoiou o evento, pelo nome e sem valor", async () => {
    getEventBySlug.mockResolvedValue(event())

    renderWithProviders(<EventPage />, "/eventos/chefs-do-bem-6a-edicao")

    const wall = await screen.findByRole("list", { name: /quem já garantiu o convite/i })
    expect(wall).toHaveTextContent("Ana Lima")
    expect(wall).not.toHaveTextContent(/R\$/)
    expect(screen.getByText(/3 pessoas e empresas apoiaram, e 1 pediu para ter o nome aqui/i)).toBeInTheDocument()
    expect(listSupporters).toHaveBeenCalledWith({ kind: "event", slug: "chefs-do-bem-6a-edicao" }, 1, null)
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
