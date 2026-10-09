import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import CampaignPage from "../pages/public/campaign-page"
import SupportersPage from "../pages/public/supporters-page"
import type { Campaign } from "../types/campaign-types"
import { renderWithProviders } from "./utils/render-with-providers"

const { getCampaignBySlug, listSupporters, listEvents } = vi.hoisted(() => ({
  getCampaignBySlug: vi.fn(),
  listSupporters: vi.fn(),
  listEvents: vi.fn(),
}))

vi.mock("../services/campaign/get-campaign-by-slug-service", () => ({ getCampaignBySlug }))

vi.mock("../services/supporter/list-supporters-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  listSupporters,
}))

vi.mock("../services/event/list-events-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  listEvents,
}))

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()

  return { ...actual, useParams: () => ({ slug: "natal-do-bem-2025" }) }
})

const FINISHED: Campaign = {
  id: "12121212-1212-4121-8121-121212121212",
  title: "Natal do Bem 2025",
  slug: "natal-do-bem-2025",
  description: "A edição de 2025 do Natal do Bem.",
  image_url: "/imagens/campanhas/natal-do-bem-2025.jpg",
  goal_amount: "90000.00",
  raised_amount: "31250.00",
  starts_at: "2025-11-01T09:00:00.000Z",
  ends_at: "2025-12-24T23:00:00.000Z",
  status: "finished",
  created_at: "2025-10-20T09:00:00.000Z",
  updated_at: "2025-12-24T23:00:00.000Z",
}

function names(count: number, offset = 0) {
  return Array.from({ length: count }, (_, index) => ({ name: `Pessoa ${offset + index + 1}` }))
}

describe("Mural do Bem", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getCampaignBySlug.mockResolvedValue(FINISHED)
    listEvents.mockResolvedValue({ events: [], total: 0 })
  })

  it("mostra na campanha encerrada quem a fez acontecer, sem formulário de doação", async () => {
    listSupporters.mockResolvedValue({ supporters: [{ name: "Ana Lima" }, { name: "Cobreq Indústria" }], total: 2, contributors: 5, seed: "s1" })

    renderWithProviders(<CampaignPage />, "/campanhas/natal-do-bem-2025")

    const wall = await screen.findByRole("list", { name: /quem fez esta campanha acontecer/i })
    expect(wall).toHaveTextContent("Ana Lima")
    expect(wall).toHaveTextContent("Cobreq Indústria")
    expect(screen.getByText(/esta campanha já foi encerrada/i)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /ir para o pagamento/i })).not.toBeInTheDocument()
  })

  it("carrega mais nomes repetindo a semente, para a ordem não embaralhar no meio da leitura", async () => {
    const user = userEvent.setup()

    listSupporters
      .mockResolvedValueOnce({ supporters: names(120), total: 130, contributors: 140, seed: "abc123" })
      .mockResolvedValueOnce({ supporters: names(10, 120), total: 130, contributors: 140, seed: "abc123" })

    renderWithProviders(<SupportersPage />, "/mural-do-bem")

    await screen.findByText("Pessoa 1")
    await user.click(screen.getByRole("button", { name: /mostrar mais nomes/i }))

    await screen.findByText("Pessoa 130")
    expect(listSupporters).toHaveBeenNthCalledWith(1, { kind: "site" }, 1, null)
    expect(listSupporters).toHaveBeenNthCalledWith(2, { kind: "site" }, 2, "abc123")
    expect(screen.queryByRole("button", { name: /mostrar mais nomes/i })).not.toBeInTheDocument()
    expect(screen.getByText(/mostrando 130 de 130 nomes/i)).toBeInTheDocument()
  })

  it("explica o mural vazio e o que fazer para entrar nele", async () => {
    listSupporters.mockResolvedValue({ supporters: [], total: 0, contributors: 0, seed: "s1" })

    renderWithProviders(<SupportersPage />, "/mural-do-bem")

    expect(await screen.findByText(/o mural ainda está em branco/i)).toBeInTheDocument()
    expect(screen.getAllByRole("link", { name: /fazer uma doação|doar agora/i }).length).toBeGreaterThan(0)
  })

  it("mostra a falha de leitura com o caminho para tentar de novo", async () => {
    listSupporters.mockRejectedValueOnce(new Error("rede")).mockResolvedValue({ supporters: [{ name: "Ana Lima" }], total: 1, contributors: 1, seed: "s2" })
    const user = userEvent.setup()

    renderWithProviders(<SupportersPage />, "/mural-do-bem")

    await user.click(await screen.findByRole("button", { name: /tentar de novo/i }))
    await waitFor(() => expect(screen.getByText("Ana Lima")).toBeInTheDocument())
  })
})
