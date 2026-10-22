import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { RequireRole } from "../components/auth/require-role"
import PartnerPanelPage from "../pages/partner/partner-panel-page"
import PartnerProposalsPage from "../pages/partner/partner-proposals-page"
import type { MyProposal, PartnerProfile } from "../types/partner-types"
import type { User, UserRole } from "../types/user-types"
import { fillField } from "./utils/fill-field"
import { renderWithProviders } from "./utils/render-with-providers"

const { getProfile, getPartnerProfile, listMyProposals, payProposal, createProposal, redirectTo, listActiveCampaigns, listEvents } = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getPartnerProfile: vi.fn(),
  listMyProposals: vi.fn(),
  payProposal: vi.fn(),
  createProposal: vi.fn(),
  redirectTo: vi.fn(),
  listActiveCampaigns: vi.fn(),
  listEvents: vi.fn(),
}))

vi.mock("../services/auth/get-profile-service", () => ({ getProfile }))

vi.mock("../services/partner/partner-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getPartnerProfile,
  listMyProposals,
  payProposal,
  createProposal,
}))

vi.mock("../utils/redirect", () => ({ redirectTo }))

vi.mock("../services/campaign/list-campaigns-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  listActiveCampaigns,
}))

vi.mock("../services/event/list-events-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  listEvents,
}))

const HASH = "e".repeat(64)

function company(status: PartnerProfile["status"]): PartnerProfile {
  return {
    id: "partner-1",
    user_id: "user-1",
    company_name: "Horizonte Embalagens Ltda",
    document: "45781296000163",
    phone: "19 3875-1200",
    website: null,
    logo_url: null,
    interests: ["sponsorship", "contribution"],
    message: "Queremos apoiar a associação.",
    public_listing: true,
    status,
    review_note: status === "approved" ? "Bem-vindos à rede de parceiros!" : status === "refused" ? "Revise o pedido e mande de novo." : null,
    reviewed_at: status === "pending" ? null : "2026-09-01T12:00:00.000Z",
    created_at: "2026-08-29T12:00:00.000Z",
    user: { id: "user-1", name: "Carla Mendes", email: "parceiro@exemplo.com.br" },
    summary: { proposals: { pending: 1, accepted: 2, refused: 0, withdrawn: 0 }, contributed: "5000.00", contributions: 1 },
  }
}

function proposal(overrides: Partial<MyProposal>): MyProposal {
  return {
    id: "p-1",
    partner_id: "partner-1",
    kind: "contribution",
    title: "Aporte para o Natal do Bem 2026",
    description: "Um aporte para as cestas de Natal das famílias.",
    amount: "5000.00",
    campaign_id: "c-1",
    event_id: null,
    status: "accepted",
    response_note: "Aceito, com muita gratidão.",
    reviewed_at: "2026-09-25T12:00:00.000Z",
    created_at: "2026-09-24T12:00:00.000Z",
    campaign: { id: "c-1", title: "Natal do Bem 2026", slug: "natal-do-bem-2026" },
    event: null,
    payment: null,
    ...overrides,
  }
}

const PROPOSALS: MyProposal[] = [
  proposal({
    id: "p-paid",
    payment: { transaction_id: "t-1", status: "confirmed", amount: "5000.00", receipt: { number: "2026/000129", hash: HASH, status: "issued" } },
  }),
  proposal({
    id: "p-sponsorship",
    kind: "sponsorship",
    title: "Patrocínio do Jantar dos Parceiros 2026",
    amount: "3000.00",
    campaign_id: null,
    campaign: null,
    event_id: "e-1",
    event: { id: "e-1", title: "Jantar dos Parceiros 2026", slug: "jantar-dos-parceiros-2026" },
  }),
  proposal({ id: "p-pending", kind: "campaign", title: "Campanha de agasalhos", status: "pending", response_note: null, amount: null, campaign: null, campaign_id: null }),
]

function signedInAs(role: UserRole) {
  const user: User = {
    id: "user-1",
    name: "Carla Mendes",
    email: "parceiro@exemplo.com.br",
    role,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  }

  window.localStorage.setItem("somosdobem.token", "token-de-teste")
  getProfile.mockResolvedValue(user)
}

describe("painel da empresa parceira", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listMyProposals.mockResolvedValue(PROPOSALS)
    listActiveCampaigns.mockResolvedValue([{ id: "c-1", title: "Natal do Bem 2026" }])
    listEvents.mockResolvedValue({ events: [], total: 0 })
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it("mostra o que já entrou, o que espera pagamento e os recibos de cada aporte", async () => {
    signedInAs("partner")
    getPartnerProfile.mockResolvedValue(company("approved"))

    renderWithProviders(<PartnerPanelPage />, "/parceiro/painel")

    expect(await screen.findByRole("heading", { name: "Horizonte Embalagens Ltda" })).toBeInTheDocument()
    const numbers = screen.getByRole("heading", { name: /o retorno da parceria/i }).closest("section") as HTMLElement
    expect(within(numbers).getByText(/5\.000,00/)).toBeInTheDocument()
    expect(screen.getByText(/bem-vindos à rede de parceiros/i)).toBeInTheDocument()

    const toPay = screen.getByRole("heading", { name: /aguardando pagamento/i }).closest("section") as HTMLElement
    expect(await within(toPay).findByText("Patrocínio do Jantar dos Parceiros 2026")).toBeInTheDocument()
    expect(within(toPay).queryByText("Aporte para o Natal do Bem 2026")).not.toBeInTheDocument()

    const receipts = screen.getByRole("heading", { name: /recibos e certificados/i }).closest("section") as HTMLElement
    expect(within(receipts).getByRole("link", { name: /certificado/i })).toHaveAttribute("href", `/certificado/${HASH}`)
    expect(within(receipts).getByRole("link", { name: /conferir/i })).toHaveAttribute("href", `/recibo/verificar?codigo=${HASH}`)
  })

  // O aporte aceito é pago pelo mesmo checkout de qualquer doação: a tela só
  // leva ao gateway, e quem confirma é o webhook.
  it("leva o patrocínio aceito ao checkout do gateway", async () => {
    const user = userEvent.setup()
    signedInAs("partner")
    getPartnerProfile.mockResolvedValue(company("approved"))
    payProposal.mockResolvedValue({ transaction_id: "t-2", checkout_url: "https://checkout.stripe.com/c/pay/cs_test_2" })

    renderWithProviders(<PartnerPanelPage />, "/parceiro/painel")

    await user.click(await screen.findByRole("button", { name: /pagar agora/i }))

    await waitFor(() => expect(redirectTo).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_test_2"))
    expect(payProposal.mock.calls[0][0]).toBe("p-sponsorship")
  })

  it("mostra o pedido em análise sem perguntar pelas propostas", async () => {
    signedInAs("partner")
    getPartnerProfile.mockResolvedValue(company("pending"))

    renderWithProviders(<PartnerPanelPage />, "/parceiro/painel")

    expect(await screen.findByText(/o pedido de parceria está em análise/i)).toBeInTheDocument()
    expect(listMyProposals).not.toHaveBeenCalled()
  })

  it("recusa o painel da empresa para quem é da equipe", async () => {
    signedInAs("communication")

    renderWithProviders(
      <RequireRole roles={["partner"]}>
        <PartnerPanelPage />
      </RequireRole>,
      "/parceiro/painel",
    )

    expect(await screen.findByRole("heading", { name: /esta tela não é do seu perfil/i })).toBeInTheDocument()
    expect(getPartnerProfile).not.toHaveBeenCalled()
  })

  it("pede o destino do patrocínio e envia o aporte com o valor em número", async () => {
    const user = userEvent.setup()
    signedInAs("partner")
    getPartnerProfile.mockResolvedValue(company("approved"))
    createProposal.mockResolvedValue(undefined)

    renderWithProviders(<PartnerProposalsPage />, "/parceiro/propostas?nova=1")

    const kind = await screen.findByLabelText(/o que a empresa propõe/i)
    await user.selectOptions(kind, "sponsorship")
    await fillField(user, /^título/i, "Patrocínio da Cantata")
    await fillField(user, /^descrição/i, "Patrocínio da Cantata de Natal com a marca no programa.")
    await fillField(user, /valor do patrocínio/i, "2.500,00")
    await user.click(screen.getByRole("button", { name: /enviar proposta/i }))

    expect(await screen.findByText(/escolha o evento ou a campanha/i)).toBeInTheDocument()
    expect(createProposal).not.toHaveBeenCalled()

    await user.selectOptions(kind, "contribution")
    await user.clear(screen.getByLabelText(/valor do aporte/i))
    await fillField(user, /valor do aporte/i, "1.500,50")
    await user.selectOptions(screen.getByLabelText(/^destino/i), "campaign:c-1")
    await user.click(screen.getByRole("button", { name: /enviar proposta/i }))

    await waitFor(() => expect(createProposal).toHaveBeenCalledTimes(1))
    expect(createProposal.mock.calls[0][0]).toEqual({
      kind: "contribution",
      title: "Patrocínio da Cantata",
      description: "Patrocínio da Cantata de Natal com a marca no programa.",
      amount: 1500.5,
      campaign_id: "c-1",
      event_id: null,
    })
  })
})
