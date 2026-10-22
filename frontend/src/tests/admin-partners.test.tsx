import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import AdminPartnerProposalsPage from "../pages/admin/admin-partner-proposals-page"
import PartnerRequestsPage from "../pages/admin/partner-requests-page"
import type { AdminProposal, PartnerApplication } from "../types/partner-types"
import type { User } from "../types/user-types"
import { fillField } from "./utils/fill-field"
import { renderWithProviders } from "./utils/render-with-providers"

const { getProfile, listPartnerApplications, reviewPartner, listPartnerProposals, reviewProposal } = vi.hoisted(() => ({
  getProfile: vi.fn(),
  listPartnerApplications: vi.fn(),
  reviewPartner: vi.fn(),
  listPartnerProposals: vi.fn(),
  reviewProposal: vi.fn(),
}))

vi.mock("../services/auth/get-profile-service", () => ({ getProfile }))

vi.mock("../services/admin/partners-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  listPartnerApplications,
  reviewPartner,
  listPartnerProposals,
  reviewProposal,
}))

const REQUEST: PartnerApplication = {
  id: "partner-1",
  user_id: "user-9",
  company_name: "Vale Verde Alimentos Ltda",
  document: "30847125000112",
  phone: "19 3894-5500",
  website: null,
  logo_url: null,
  interests: ["in_kind", "sponsorship"],
  message: "Queremos doar os insumos dos eventos com refeição.",
  public_listing: true,
  status: "pending",
  review_note: null,
  reviewed_at: null,
  created_at: "2026-10-06T14:00:00.000Z",
  user: { id: "user-9", name: "Rafael Souza", email: "parcerias.valeverde@exemplo.com.br" },
  reviewer: null,
}

const PROPOSAL: AdminProposal = {
  id: "proposal-1",
  partner_id: "partner-2",
  kind: "sponsorship",
  title: "Patrocínio do Jantar dos Parceiros 2026",
  description: "Uma cota do jantar com a marca no material.",
  amount: "3000.00",
  campaign_id: null,
  event_id: "event-1",
  status: "pending",
  response_note: null,
  reviewed_at: null,
  created_at: "2026-10-02T11:00:00.000Z",
  campaign: null,
  event: { id: "event-1", title: "Jantar dos Parceiros 2026", slug: "jantar-dos-parceiros-2026" },
  transaction_id: null,
  partner: { id: "partner-2", company_name: "Horizonte Embalagens Ltda", phone: null, user: { id: "user-1", name: "Carla Mendes", email: "parceiro@exemplo.com.br" } },
  transaction: null,
  reviewer: null,
}

function signedIn() {
  const user: User = {
    id: "user-admin",
    name: "Direção Somos do Bem",
    email: "admin@somosdobem.org.br",
    role: "admin",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  }

  window.localStorage.setItem("somosdobem.token", "token-de-teste")
  getProfile.mockResolvedValue(user)
}

describe("parcerias no painel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signedIn()
    listPartnerApplications.mockResolvedValue({ partners: [REQUEST], total: 1, pending: 1 })
    listPartnerProposals.mockResolvedValue({ proposals: [PROPOSAL], total: 1, pending: 1 })
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it("aprova o pedido com um recado opcional, e diz que a marca entra na rede", async () => {
    const user = userEvent.setup()
    reviewPartner.mockResolvedValue(undefined)

    renderWithProviders(<PartnerRequestsPage />, "/admin/parcerias/pedidos")

    expect(await screen.findByRole("heading", { name: /vale verde alimentos/i })).toBeInTheDocument()
    expect(screen.getByText("CNPJ 30.847.125/0001-12")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /^aprovar$/i }))

    const dialog = screen.getByRole("dialog", { name: /aprovar a parceria/i })
    expect(within(dialog).getByText(/a marca entra na rede de parceiros do site/i)).toBeInTheDocument()

    await user.click(within(dialog).getByRole("button", { name: /aprovar parceria/i }))

    await waitFor(() => expect(reviewPartner).toHaveBeenCalledTimes(1))
    expect(reviewPartner.mock.calls[0][0]).toEqual({ id: "partner-1", decision: "approved", note: null })
    expect(await screen.findByText(/entrou na rede de parceiros/i)).toBeInTheDocument()
  })

  it("não recusa um pedido sem o motivo que a empresa vai ler", async () => {
    const user = userEvent.setup()

    renderWithProviders(<PartnerRequestsPage />, "/admin/parcerias/pedidos")

    await user.click(await screen.findByRole("button", { name: /^recusar$/i }))
    await user.click(screen.getByRole("button", { name: /recusar pedido/i }))

    expect(await screen.findByText(/escreva pelo menos 10 caracteres/i)).toBeInTheDocument()
    expect(reviewPartner).not.toHaveBeenCalled()
  })

  it("aceita a proposta dizendo que o pagamento fica liberado no painel da empresa", async () => {
    const user = userEvent.setup()
    reviewProposal.mockResolvedValue(undefined)

    renderWithProviders(<AdminPartnerProposalsPage />, "/admin/parcerias/propostas")

    expect(await screen.findByRole("heading", { name: /patrocínio do jantar dos parceiros/i })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /^aceitar$/i }))

    const dialog = screen.getByRole("dialog", { name: /aceitar a proposta/i })
    expect(within(dialog).getByText(/o pagamento de R\$\s3\.000,00 fica liberado no painel da empresa/i)).toBeInTheDocument()

    await fillField(user, /como a proposta segue/i, "Aceito! A marca entra no material do jantar.")
    await user.click(within(dialog).getByRole("button", { name: /aceitar proposta/i }))

    await waitFor(() => expect(reviewProposal).toHaveBeenCalledTimes(1))
    expect(reviewProposal.mock.calls[0][0]).toEqual({ id: "proposal-1", decision: "accepted", note: "Aceito! A marca entra no material do jantar." })
  })
})
