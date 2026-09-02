import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NotFoundError } from "../config/errors"
import VerifyReceiptPage from "../pages/public/verify-receipt-page"
import type { ReceiptVerification } from "../types/receipt-types"
import { renderWithProviders } from "./utils/render-with-providers"

const { verifyReceipt } = vi.hoisted(() => ({ verifyReceipt: vi.fn() }))

vi.mock("../services/receipt/verify-receipt-service", () => ({ verifyReceipt }))

const HASH = "a".repeat(64)

function verification(overrides: Partial<ReceiptVerification> = {}): ReceiptVerification {
  return {
    authentic: true,
    valid: true,
    checks: { content_matches: true, chain_matches: true },
    receipt: {
      number: "2026/000123",
      sequence: 123,
      status: "issued",
      donor_name: "Maria Aparecida",
      donor_document: "123.***.***-09",
      amount: "150.00",
      transaction_type: "donation",
      issued_at: "2026-03-02T12:00:00.000Z",
      cancelled_at: null,
      hash: HASH,
      previous_hash: "b".repeat(64),
    },
    ...overrides,
  }
}

async function submit(code: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/código do documento/i), code)
  await user.click(screen.getByRole("button", { name: /verificar/i }))
}

describe("verificação pública de documento", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("confirma um documento autêntico e mostra o que foi conferido", async () => {
    verifyReceipt.mockResolvedValue(verification())

    renderWithProviders(<VerifyReceiptPage />)
    await submit(HASH)

    await waitFor(() => expect(screen.getByText(/documento autêntico$/i)).toBeInTheDocument())
    expect(screen.getByText("2026/000123")).toBeInTheDocument()
    expect(screen.getByText("R$ 150,00")).toBeInTheDocument()
  })

  it("separa autêntico de válido quando o documento foi cancelado", async () => {
    verifyReceipt.mockResolvedValue(
      verification({
        valid: false,
        receipt: { ...verification().receipt, status: "cancelled", cancelled_at: "2026-04-01T12:00:00.000Z" },
      }),
    )

    renderWithProviders(<VerifyReceiptPage />)
    await submit(HASH)

    await waitFor(() => expect(screen.getByText(/autêntico, mas cancelado/i)).toBeInTheDocument())
  })

  it("avisa quando o código não existe, sem culpar quem consultou", async () => {
    verifyReceipt.mockRejectedValue(new NotFoundError("Recibo não encontrado"))

    renderWithProviders(<VerifyReceiptPage />)
    await submit(HASH)

    await waitFor(() => expect(screen.getByText(/não encontramos esse código/i)).toBeInTheDocument())
  })

  it("a corrente interativa propaga o estrago para a frente, e só para a frente", async () => {
    const user = userEvent.setup()
    renderWithProviders(<VerifyReceiptPage />)

    // Estado inicial: nada rompido.
    expect(screen.getAllByText("confere")).toHaveLength(4)

    await user.click(screen.getByRole("button", { name: /recibo 000121/i }))

    expect(screen.getByText("conteúdo alterado")).toBeInTheDocument()
    // O primeiro recibo é anterior ao adulterado, então continua íntegro.
    expect(screen.getAllByText("confere")).toHaveLength(1)
    expect(screen.getAllByText("elo rompido")).toHaveLength(2)
    expect(screen.getByText(/não dá para alterar um documento sem quebrar/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /restaurar a corrente/i }))

    expect(screen.getAllByText("confere")).toHaveLength(4)
    expect(screen.queryByText("elo rompido")).not.toBeInTheDocument()
  })

  it("não chama a API com um código curto demais", async () => {
    renderWithProviders(<VerifyReceiptPage />)
    await submit("abc")

    expect(await screen.findByText(/cole o código completo/i)).toBeInTheDocument()
    expect(verifyReceipt).not.toHaveBeenCalled()
  })
})
