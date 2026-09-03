import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NotFoundError } from "../config/errors"
import OrderStatusPage from "../pages/public/order-status-page"
import type { TransactionStatusView } from "../types/transaction-types"
import { renderWithProviders } from "./utils/render-with-providers"

const { getTransactionStatus } = vi.hoisted(() => ({ getTransactionStatus: vi.fn() }))

vi.mock("../services/transaction/get-transaction-status-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getTransactionStatus,
}))

// A rota tem `:transacaoId`, e o `useParams` só o enxerga se a rota existir na
// árvore montada, e por isso o teste monta a rota, e não só a página.
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()

  return { ...actual, useParams: () => ({ transacaoId: TX_ID }) }
})

const TX_ID = "22222222-2222-4222-8222-222222222222"

function status(overrides: Partial<TransactionStatusView> = {}): TransactionStatusView {
  return {
    id: TX_ID,
    type: "donation",
    status: "pending",
    amount: "200.00",
    payment_method: null,
    confirmed_at: null,
    created_at: "2026-09-03T12:00:00.000Z",
    receipt_hash: null,
    receipt_number: null,
    ...overrides,
  }
}

describe("status do pedido", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // A regra mais importante da tela: voltar do gateway não é prova de pagamento.
  it("não afirma que o pagamento deu certo enquanto o backend não confirmou", async () => {
    getTransactionStatus.mockResolvedValue(status())

    renderWithProviders(<OrderStatusPage />, `/pedido/${TX_ID}/status`)

    expect(await screen.findByRole("heading", { name: /estamos confirmando seu pagamento/i })).toBeInTheDocument()
    expect(screen.queryByText(/obrigado\. sua contribuição chegou/i)).not.toBeInTheDocument()

    // Sem confirmação não existe documento, então não pode existir link para ele.
    expect(screen.queryByRole("link", { name: /conferir o recibo/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /baixar em pdf/i })).not.toBeInTheDocument()
  })

  it("só oferece o recibo depois de confirmada", async () => {
    getTransactionStatus.mockResolvedValue(
      status({
        status: "confirmed",
        confirmed_at: "2026-09-03T12:20:00.000Z",
        payment_method: "credit_card",
        receipt_hash: "c".repeat(64),
        receipt_number: "2026/000090",
      }),
    )

    renderWithProviders(<OrderStatusPage />, `/pedido/${TX_ID}/status`)

    expect(await screen.findByRole("heading", { name: /obrigado\. sua contribuição chegou/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /conferir o recibo/i })).toBeInTheDocument()
    expect(screen.getByText(/2026\/000090/)).toBeInTheDocument()
  })

  it("separa recusa de estorno, porque dizem coisas diferentes", async () => {
    getTransactionStatus.mockResolvedValue(status({ status: "refused" }))

    const { unmount } = renderWithProviders(<OrderStatusPage />, `/pedido/${TX_ID}/status`)
    expect(await screen.findByRole("heading", { name: /o pagamento não foi aprovado/i })).toBeInTheDocument()
    expect(screen.getByText(/nada foi debitado/i)).toBeInTheDocument()
    unmount()

    getTransactionStatus.mockResolvedValue(status({ status: "refunded" }))

    renderWithProviders(<OrderStatusPage />, `/pedido/${TX_ID}/status`)
    expect(await screen.findByRole("heading", { name: /este pedido foi estornado/i })).toBeInTheDocument()
    expect(screen.getByText(/deixou de valer/i)).toBeInTheDocument()
  })

  it("trata pedido inexistente como resposta, não como falha do sistema", async () => {
    getTransactionStatus.mockRejectedValue(new NotFoundError("Pedido não encontrado"))

    renderWithProviders(<OrderStatusPage />, `/pedido/${TX_ID}/status`)

    expect(await screen.findByText(/pedido não encontrado/i)).toBeInTheDocument()
    expect(screen.queryByText(/não conseguimos consultar o pedido/i)).not.toBeInTheDocument()
  })
})
