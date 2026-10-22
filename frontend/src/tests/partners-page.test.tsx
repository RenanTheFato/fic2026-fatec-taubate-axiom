import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import PartnerSignupPage from "../pages/public/partner-signup-page"
import PartnersPage from "../pages/public/partners-page"
import { fillField } from "./utils/fill-field"
import { renderWithProviders } from "./utils/render-with-providers"

const { listPartners, applyPartner, authenticate, getProfile } = vi.hoisted(() => ({
  listPartners: vi.fn(),
  applyPartner: vi.fn(),
  authenticate: vi.fn(),
  getProfile: vi.fn(),
}))

vi.mock("../services/partner/list-partners-service", () => ({ listPartners }))

vi.mock("../services/partner/partner-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  applyPartner,
}))

vi.mock("../services/auth/auth-user-service", () => ({ authenticate }))

vi.mock("../services/auth/get-profile-service", () => ({ getProfile }))

function renderSignup() {
  return renderWithProviders(
    <Routes>
      <Route path="/seja-parceiro" element={<PartnerSignupPage />} />
      <Route path="/parceiro/painel" element={<p>painel da empresa</p>} />
    </Routes>,
    "/seja-parceiro",
  )
}

type User = ReturnType<typeof userEvent.setup>

async function fillCompany(user: User, document: string) {
  await fillField(user, /nome da empresa/i, "Horizonte Embalagens Ltda")
  await fillField(user, /^cnpj/i, document)
  await fillField(user, /telefone/i, "1938751200")
  await fillField(user, /nome completo/i, "Carla Mendes")
  await fillField(user, /^e-mail/i, "parceiro@exemplo.com.br")
  await fillField(user, /^senha/i, "Parceria@2026")
  await fillField(user, /repita a senha/i, "Parceria@2026")
  await fillField(user, /conte sobre a empresa/i, "Queremos patrocinar um evento por semestre e apoiar as campanhas.")
  await user.click(screen.getByRole("checkbox", { name: /patrocínio de eventos/i }))
  await user.click(screen.getByRole("checkbox", { name: /tratar da parceria/i }))
}

describe("parceiros", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listPartners.mockResolvedValue([
      { id: "1", name: "Mann + Hummel", logo: null, site: null },
      { id: "2", name: "Cobreq", logo: null, site: null },
    ])
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  // Parceiro sem arquivo de logo continua sendo um item de lista com nome
  // legível, e não um buraco na grade: é isso que mantém a página apresentável
  // enquanto as marcas não chegam.
  it("lista a rede com nome acessível por parceiro", async () => {
    renderWithProviders(<PartnersPage />, "/parceiros")

    expect(screen.getByRole("heading", { name: /^parceiros$/i })).toBeInTheDocument()
    expect(await screen.findByText("Mann + Hummel")).toBeInTheDocument()
    expect(screen.getByText("Cobreq")).toBeInTheDocument()
  })

  it("leva quem quer entrar na rede ao pedido de parceria", () => {
    renderWithProviders(<PartnersPage />, "/parceiros")

    expect(screen.getByRole("link", { name: /quero ser parceiro/i })).toHaveAttribute("href", "/seja-parceiro")
    expect(screen.getByRole("link", { name: /painel do parceiro/i })).toHaveAttribute("href", "/entrar")
    expect(screen.getByRole("heading", { name: /como uma empresa entra na rede/i })).toBeInTheDocument()
  })

  it("recusa um CNPJ com o dígito errado antes de enviar", async () => {
    const user = userEvent.setup()
    renderSignup()

    await fillCompany(user, "45.781.296/0001-00")
    await user.click(screen.getByRole("button", { name: /enviar pedido de parceria/i }))

    expect(await screen.findByText(/o cnpj não confere/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText(/^cnpj/i)).toHaveFocus())
    expect(applyPartner).not.toHaveBeenCalled()
  })

  // O pedido cria a conta da empresa, e a tela já entra com ela: a análise é
  // acompanhada pelo painel.
  it("envia o pedido com a conta da empresa e leva ao painel", async () => {
    const user = userEvent.setup()
    applyPartner.mockResolvedValue(undefined)
    authenticate.mockResolvedValue("token-novo")
    getProfile.mockResolvedValue({
      id: "user-1",
      name: "Carla Mendes",
      email: "parceiro@exemplo.com.br",
      role: "partner",
      created_at: "2026-10-22T12:00:00.000Z",
      updated_at: "2026-10-22T12:00:00.000Z",
    })

    renderSignup()

    await fillCompany(user, "45.781.296/0001-63")
    await user.click(screen.getByRole("button", { name: /enviar pedido de parceria/i }))

    expect(await screen.findByText("painel da empresa")).toBeInTheDocument()
    expect(applyPartner.mock.calls[0][0]).toEqual(expect.objectContaining({
      company_name: "Horizonte Embalagens Ltda",
      document: "45.781.296/0001-63",
      interests: ["sponsorship"],
      public_listing: false,
      email: "parceiro@exemplo.com.br",
    }))
  })
})
