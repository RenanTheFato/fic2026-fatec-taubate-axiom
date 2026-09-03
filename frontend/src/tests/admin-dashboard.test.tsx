import { screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import DashboardPage from "../pages/admin/dashboard-page"
import type { User, UserRole } from "../types/user-types"
import { renderWithProviders } from "./utils/render-with-providers"

const { getProfile, listTransactions, listAllCampaigns, summarizeItems } = vi.hoisted(() => ({
  getProfile: vi.fn(),
  listTransactions: vi.fn(),
  listAllCampaigns: vi.fn(),
  summarizeItems: vi.fn(),
}))

vi.mock("../services/auth/get-profile-service", () => ({ getProfile }))

vi.mock("../services/admin/list-transactions-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  listTransactions,
}))

vi.mock("../services/admin/list-all-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  listAllCampaigns,
}))

vi.mock("../services/admin/summarize-items-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  summarizeItems,
}))

function profile(role: UserRole): User {
  return {
    id: "88888888-8888-4888-8888-888888888888",
    name: "Equipe Somos do Bem",
    email: "equipe@somosdobem.org.br",
    role,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  }
}

function signedInAs(role: UserRole) {
  window.localStorage.setItem("somosdobem.token", "token-de-teste")
  getProfile.mockResolvedValue(profile(role))
}

describe("painel geral", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listTransactions.mockResolvedValue({ transactions: [], total: 0 })
    summarizeItems.mockResolvedValue({ items: [], totals: { quantity: 0, revenue: "0.00" } })
    listAllCampaigns.mockResolvedValue([])
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  // O backend responde 403 a `GET /campaign/list-all` para o papel `finance`, e
  // a tela chegava a perguntar assim mesmo. O resultado era um "as campanhas não
  // carregaram" no painel de quem nunca deveria ver campanha nenhuma.
  it("não pergunta pelas campanhas quando quem entra é o financeiro", async () => {
    signedInAs("finance")

    renderWithProviders(<DashboardPage />, "/admin")

    await waitFor(() => expect(listTransactions).toHaveBeenCalled())

    expect(listAllCampaigns).not.toHaveBeenCalled()
    expect(screen.queryByRole("heading", { name: /^campanhas$/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/as campanhas não carregaram/i)).not.toBeInTheDocument()
  })

  it("não pergunta pelo caixa quando quem entra é a comunicação", async () => {
    signedInAs("communication")

    renderWithProviders(<DashboardPage />, "/admin")

    expect(await screen.findByRole("heading", { name: /^campanhas$/i })).toBeInTheDocument()

    expect(listTransactions).not.toHaveBeenCalled()
    expect(summarizeItems).not.toHaveBeenCalled()
  })

  it("mostra as duas metades para a administração", async () => {
    signedInAs("admin")

    renderWithProviders(<DashboardPage />, "/admin")

    expect(await screen.findByRole("heading", { name: /^campanhas$/i })).toBeInTheDocument()
    await waitFor(() => expect(listTransactions).toHaveBeenCalled())
    expect(listAllCampaigns).toHaveBeenCalled()
  })
})
