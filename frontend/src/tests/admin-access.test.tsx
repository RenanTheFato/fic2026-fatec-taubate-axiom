import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { RequireRole } from "../components/auth/require-role"
import TransactionsPage from "../pages/admin/transactions-page"
import type { AdminTransaction } from "../services/admin/list-transactions-service"
import type { User, UserRole } from "../types/user-types"
import { fillField } from "./utils/fill-field"
import { renderWithProviders } from "./utils/render-with-providers"

const { getProfile, listTransactions, actOnTransaction } = vi.hoisted(() => ({
  getProfile: vi.fn(),
  listTransactions: vi.fn(),
  actOnTransaction: vi.fn(),
}))

vi.mock("../services/auth/get-profile-service", () => ({ getProfile }))

vi.mock("../services/admin/list-transactions-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  listTransactions,
}))

vi.mock("../services/admin/transaction-actions-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  actOnTransaction,
}))

function user(role: UserRole): User {
  return {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Equipe Somos do Bem",
    email: "equipe@somosdobem.org.br",
    role,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  }
}

function transaction(overrides: Partial<AdminTransaction> = {}): AdminTransaction {
  return {
    id: "55555555-5555-4555-8555-555555555555",
    type: "donation",
    status: "confirmed",
    amount: "300.00",
    payment_method: "pix",
    donor_id: "66666666-6666-4666-8666-666666666666",
    campaign_id: null,
    event_id: null,
    gateway_checkout_id: "cs_test_1",
    gateway_payment_id: "pi_test_1",
    checkout_url: "https://checkout.stripe.com/c/pay/cs_test_1",
    notes: null,
    confirmed_at: "2026-08-30T12:00:00.000Z",
    refunded_at: null,
    created_at: "2026-08-30T11:00:00.000Z",
    updated_at: "2026-08-30T12:00:00.000Z",
    donor: { id: "66666666-6666-4666-8666-666666666666", name: "Otávio Moraes", email: "otavio@exemplo.com.br" },
    campaign: null,
    event: null,
    ...overrides,
  }
}

// A sessão é reconstruída a partir do token guardado, então o teste guarda um
// token e dubla o perfil, que é o mesmo caminho que o navegador percorre.
function signedInAs(role: UserRole) {
  window.localStorage.setItem("somosdobem.token", "token-de-teste")
  getProfile.mockResolvedValue(user(role))
}

describe("área privada", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listTransactions.mockResolvedValue({ transactions: [transaction()], total: 1 })
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it("recusa a tela financeira para quem é de comunicação, sem mandar ao login de novo", async () => {
    signedInAs("communication")

    renderWithProviders(
      <RequireRole roles={["admin", "finance"]}>
        <TransactionsPage />
      </RequireRole>,
      "/admin/financeiro/transacoes",
    )

    expect(await screen.findByRole("heading", { name: /esta tela não é do seu perfil/i })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /^transações$/i })).not.toBeInTheDocument()
  })

  it("mostra as transações para o financeiro e oferece o estorno", async () => {
    signedInAs("finance")

    renderWithProviders(
      <RequireRole roles={["admin", "finance"]}>
        <TransactionsPage />
      </RequireRole>,
      "/admin/financeiro/transacoes",
    )

    expect(await screen.findByRole("heading", { name: /^transações$/i })).toBeInTheDocument()
    expect(await screen.findAllByText("Otávio Moraes")).not.toHaveLength(0)
    expect(await screen.findAllByRole("button", { name: /estornar/i })).not.toHaveLength(0)
  })

  // O estorno vive na interface do papel `finance`: quem administra o sistema
  // não é necessariamente quem responde pelo caixa.
  it("não oferece o estorno para a administração", async () => {
    signedInAs("admin")

    renderWithProviders(
      <RequireRole roles={["admin", "finance"]}>
        <TransactionsPage />
      </RequireRole>,
      "/admin/financeiro/transacoes",
    )

    expect(await screen.findByRole("heading", { name: /^transações$/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /estornar/i })).not.toBeInTheDocument()
  })

  it("não aplica uma ação de dinheiro sem motivo registrado", async () => {
    signedInAs("finance")

    renderWithProviders(
      <RequireRole roles={["admin", "finance"]}>
        <TransactionsPage />
      </RequireRole>,
      "/admin/financeiro/transacoes",
    )

    const person = userEvent.setup()
    const [refund] = await screen.findAllByRole("button", { name: /estornar/i })
    await person.click(refund)

    const dialog = await screen.findByRole("dialog")
    expect(dialog).toBeInTheDocument()

    await person.click(screen.getByRole("button", { name: /estornar mesmo assim/i }))

    expect(await screen.findByText(/descreva o motivo/i)).toBeInTheDocument()
    expect(actOnTransaction).not.toHaveBeenCalled()

    await fillField(person, /motivo/i, "Doador pediu o estorno por engano no valor")
    await person.click(screen.getByRole("button", { name: /estornar mesmo assim/i }))

    expect(actOnTransaction).toHaveBeenCalledWith(
      "refund",
      "55555555-5555-4555-8555-555555555555",
      "Doador pediu o estorno por engano no valor",
    )
  })
})
