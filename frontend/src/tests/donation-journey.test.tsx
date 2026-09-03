import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { CheckoutError } from "../config/errors"
import DonatePage from "../pages/public/donate-page"
import type { Campaign } from "../types/campaign-types"
import type { Transaction } from "../types/transaction-types"
import { fillField } from "./utils/fill-field"
import { renderWithProviders } from "./utils/render-with-providers"

const { listActiveCampaigns, createTransaction, redirectTo } = vi.hoisted(() => ({
  listActiveCampaigns: vi.fn(),
  createTransaction: vi.fn(),
  redirectTo: vi.fn(),
}))

vi.mock("../services/campaign/list-campaigns-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  listActiveCampaigns,
}))

vi.mock("../services/transaction/create-transaction-service", () => ({ createTransaction }))

vi.mock("../utils/redirect", () => ({ redirectTo }))

const CAMPAIGN: Campaign = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Ambulatório: atendimento contínuo",
  slug: "ambulatorio-atendimento-continuo",
  description: "Sustenta o custo fixo da equipe do Ambulatório.",
  goal_amount: "180000.00",
  raised_amount: "45000.00",
  starts_at: "2026-01-05T09:00:00.000Z",
  ends_at: "2026-12-20T23:00:00.000Z",
  status: "active",
  created_at: "2026-01-05T09:00:00.000Z",
  updated_at: "2026-01-05T09:00:00.000Z",
}

function transaction(): Transaction {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    type: "donation",
    status: "pending",
    amount: "100.00",
    payment_method: null,
    donor_id: "33333333-3333-4333-8333-333333333333",
    campaign_id: CAMPAIGN.id,
    event_id: null,
    gateway_checkout_id: "cs_test_123",
    gateway_payment_id: null,
    checkout_url: "https://checkout.stripe.com/c/pay/cs_test_123",
    notes: null,
    confirmed_at: null,
    refunded_at: null,
    created_at: "2026-09-03T12:00:00.000Z",
    updated_at: "2026-09-03T12:00:00.000Z",
  }
}

// A lista de campanhas é uma query, e ela resolvendo no meio da digitação
// re-renderiza a página inteira, e com campo controlado isso derruba tecla e o
// nome chega cortado. Esperar a lista aparecer antes de digitar não é truque de
// teste: é o que a pessoa de verdade faz, porque o formulário ainda está
// carregando.
async function settled() {
  const user = userEvent.setup()
  await screen.findByRole("button", { name: /atendimento contínuo/i })

  return user
}

async function fillDonor(user: ReturnType<typeof userEvent.setup>) {
  await fillField(user, /nome completo/i, "Maria Aparecida da Silva")
  await fillField(user, /^e-mail/i, "maria@exemplo.com.br")
}

describe("jornada de doação", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listActiveCampaigns.mockResolvedValue([CAMPAIGN])
  })

  it("leva ao pagamento com o valor e a campanha escolhidos", async () => {
    createTransaction.mockResolvedValue(transaction())

    renderWithProviders(<DonatePage />, "/doe-agora")

    const user = await settled()

    // "Ambulatório" sozinho também casa com a opção padrão, que cita as três
    // frentes no texto de apoio. O nome acessível precisa ser o do card certo.
    await user.click(screen.getByRole("button", { name: /atendimento contínuo/i }))
    await user.click(screen.getByRole("button", { name: /^R\$\s*200,00$/ }))
    await fillDonor(user)
    await user.click(screen.getByRole("button", { name: /ir para o pagamento/i }))

    await waitFor(() => expect(createTransaction).toHaveBeenCalledTimes(1))

    expect(createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "donation",
        amount: 200,
        campaign_id: CAMPAIGN.id,
        donor_name: "Maria Aparecida da Silva",
        donor_email: "maria@exemplo.com.br",
      }),
    )

    // O que o teste prova é que a tela manda a pessoa para o checkout do
    // gateway, e não que o jsdom navegou.
    await waitFor(() => expect(redirectTo).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_test_123"))
  })

  it("não chama o backend quando os dados do doador não são válidos", async () => {
    renderWithProviders(<DonatePage />, "/doe-agora")

    const user = await settled()
    await fillField(user, /nome completo/i, "Ma")
    await fillField(user, /^e-mail/i, "sem-arroba")
    await user.click(screen.getByRole("button", { name: /ir para o pagamento/i }))

    expect(await screen.findByText(/informe o nome completo/i)).toBeInTheDocument()
    expect(screen.getByText(/informe um e-mail válido/i)).toBeInTheDocument()
    expect(createTransaction).not.toHaveBeenCalled()

    // O foco vai para o primeiro campo inválido: pintar de vermelho e deixar o
    // foco onde estava obriga quem usa teclado a caçar o erro.
    expect(screen.getByLabelText(/nome completo/i)).toHaveFocus()
  })

  it("mostra a recusa do backend em vez de um erro genérico", async () => {
    createTransaction.mockRejectedValue(new CheckoutError("Only an active campaign can receive new transactions"))

    renderWithProviders(<DonatePage />, "/doe-agora")

    const user = await settled()
    await fillDonor(user)
    await user.click(screen.getByRole("button", { name: /ir para o pagamento/i }))

    expect(await screen.findByText(/only an active campaign/i)).toBeInTheDocument()
  })
})
