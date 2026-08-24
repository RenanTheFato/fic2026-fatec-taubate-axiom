import { Campaign } from "../models/campaign-model.js";
import { Donor } from "../models/donor-model.js";
import { Receipt } from "../models/receipt-model.js";
import { Transaction } from "../models/transaction-model.js";
import { TransactionAuditLog } from "../models/transaction-audit-log-model.js";
import { ConfirmTransactionController } from "../controllers/transaction/confirm-transaction-controller.js";
import { VerifyReceiptController } from "../controllers/receipt/verify-receipt-controller.js";
import { DownloadReceiptController } from "../controllers/receipt/download-receipt-controller.js";
import { DownloadReceiptCertificateController } from "../controllers/receipt/download-receipt-certificate-controller.js";
import { RefundTransactionService } from "../services/transaction/refund-transaction-service.js";
import { buildReceiptHash } from "../utils/receipt-hash.js";
import { mockRequest, mockResponse } from "./utils/mock-http.js";
import { mockSequelizeTransaction } from "./utils/mock-sequelize.js";

const financeUserId = "user-finance-1"
const donorId = "donor-1"
const transactionId = "transaction-1"

function confirmableTransaction(overrides: Record<string, unknown> = {}) {
  const attributes = {
    id: transactionId,
    type: "donation",
    status: "pending",
    amount: "150.00",
    donor_id: donorId,
    campaign_id: "campaign-1",
    event_id: null,
    ...overrides,
  }

  return {
    ...attributes,
    update: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockReturnValue(attributes),
  }
}

// Um recibo já gravado, com o hash calculado de verdade sobre o próprio conteúdo. É o ponto de
// partida dos testes de verificação: o que estiver diferente daqui em diante é adulteração.
function storedReceipt(overrides: Record<string, unknown> = {}) {
  const attributes = {
    id: "receipt-1",
    transaction_id: transactionId,
    sequence: 2,
    number: "2026/000002",
    status: "issued",
    donor_name: "Maria Oliveira",
    donor_document: "12345678901",
    amount: "150.00",
    transaction_type: "donation",
    issued_at: new Date("2026-08-24T12:00:00.000Z"),
    cancelled_at: null,
    previous_hash: "a".repeat(64),
    ...overrides,
  }

  return {
    ...attributes,
    hash: buildReceiptHash(attributes as never),
    update: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockReturnValue(attributes),
  }
}

describe("Receipt ledger (issuance, hash chain and public verification)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    mockSequelizeTransaction()

    jest.spyOn(Campaign, "increment").mockResolvedValue({} as never)
    jest.spyOn(TransactionAuditLog, "create").mockResolvedValue({} as never)
    jest.spyOn(Donor, "findByPk").mockResolvedValue({
      id: donorId,
      name: "Maria Oliveira",
      document: "12345678901",
    } as never)
  })

  it("issues the first receipt of the chain when a transaction is confirmed", async () => {
    const transaction = confirmableTransaction()
    jest.spyOn(Transaction, "findByPk").mockResolvedValue(transaction as never)
    jest.spyOn(Receipt, "findOne").mockResolvedValue(null)
    jest.spyOn(Receipt, "create").mockImplementation((async (values: Record<string, unknown>) => ({
      get: () => values,
    })) as never)

    const req = mockRequest({
      user: { id: financeUserId },
      params: { id: transactionId },
      body: { reason: "Comprovante conferido no painel do Stripe" },
    } as never)
    const res = mockResponse()

    await new ConfirmTransactionController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(200)

    const issued = (Receipt.create as jest.Mock).mock.calls[0][0]

    expect(issued.sequence).toBe(1)
    expect(issued.previous_hash).toBeNull()
    expect(issued.number).toBe(`${new Date().getUTCFullYear()}/000001`)
    expect(issued.hash).toMatch(/^[0-9a-f]{64}$/)
    // O recibo copia o valor e o tipo da transação, não os relê do doador depois.
    expect(issued.amount).toBe("150.00")
    expect(issued.transaction_type).toBe("donation")
  })

  it("links a new receipt to the hash of the one before it", async () => {
    const previousHash = "b".repeat(64)
    const transaction = confirmableTransaction()

    jest.spyOn(Transaction, "findByPk").mockResolvedValue(transaction as never)
    jest.spyOn(Receipt, "findOne").mockResolvedValue({ sequence: 7, hash: previousHash } as never)
    jest.spyOn(Receipt, "create").mockImplementation((async (values: Record<string, unknown>) => ({
      get: () => values,
    })) as never)

    const req = mockRequest({
      user: { id: financeUserId },
      params: { id: transactionId },
      body: {},
    } as never)
    const res = mockResponse()

    await new ConfirmTransactionController().handle(req, res)

    const issued = (Receipt.create as jest.Mock).mock.calls[0][0]

    expect(issued.sequence).toBe(8)
    expect(issued.previous_hash).toBe(previousHash)
    expect(issued.number).toBe(`${new Date().getUTCFullYear()}/000008`)
  })

  it("confirms an untouched receipt on the public endpoint and masks the document", async () => {
    const receipt = storedReceipt()

    jest.spyOn(Receipt, "findOne").mockImplementation((async (options: { where: Record<string, unknown> }) => {
      if (options.where.hash) return receipt
      return { hash: receipt.previous_hash }
    }) as never)

    const req = mockRequest({ params: { hash: receipt.hash } } as never)
    const res = mockResponse()

    await new VerifyReceiptController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(200)

    const body = (res.json as jest.Mock).mock.calls[0][0]

    expect(body.authentic).toBe(true)
    expect(body.valid).toBe(true)
    expect(body.checks).toEqual({ content_matches: true, chain_matches: true })
    // Regra 3.6: o documento do doador não sai inteiro por endpoint aberto.
    expect(body.receipt.donor_document).toBe("***.456.789-**")
    expect(body.receipt.donor_document).not.toContain("123")
  })

  it("detects a receipt whose amount was edited straight in the database", async () => {
    const receipt = storedReceipt()
    const tampered = { ...receipt, amount: "1500.00" }

    jest.spyOn(Receipt, "findOne").mockImplementation((async (options: { where: Record<string, unknown> }) => {
      if (options.where.hash) return tampered
      return { hash: receipt.previous_hash }
    }) as never)

    const req = mockRequest({ params: { hash: receipt.hash } } as never)
    const res = mockResponse()

    await new VerifyReceiptController().handle(req, res)

    const body = (res.json as jest.Mock).mock.calls[0][0]

    expect(body.authentic).toBe(false)
    expect(body.valid).toBe(false)
    expect(body.checks.content_matches).toBe(false)
  })

  it("detects a broken link even when the receipt itself was rehashed", async () => {
    // O adulterador reescreveu o recibo e recalculou o hash dele, então o conteúdo bate consigo
    // mesmo. O que não bate é o elo: o antecessor real tem outro hash.
    const receipt = storedReceipt({ amount: "1500.00" })

    jest.spyOn(Receipt, "findOne").mockImplementation((async (options: { where: Record<string, unknown> }) => {
      if (options.where.hash) return receipt
      return { hash: "c".repeat(64) }
    }) as never)

    const req = mockRequest({ params: { hash: receipt.hash } } as never)
    const res = mockResponse()

    await new VerifyReceiptController().handle(req, res)

    const body = (res.json as jest.Mock).mock.calls[0][0]

    expect(body.checks.content_matches).toBe(true)
    expect(body.checks.chain_matches).toBe(false)
    expect(body.authentic).toBe(false)
  })

  it("answers 404 for a hash that belongs to no receipt", async () => {
    jest.spyOn(Receipt, "findOne").mockResolvedValue(null)

    const req = mockRequest({ params: { hash: "f".repeat(64) } } as never)
    const res = mockResponse()

    await new VerifyReceiptController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: "Receipt Not Found" })
  })

  it("cancels the receipt on refund without touching its hash", async () => {
    const receipt = storedReceipt()
    const refunded = confirmableTransaction({ status: "confirmed" })

    jest.spyOn(Transaction, "findByPk").mockResolvedValue(refunded as never)
    jest.spyOn(Campaign, "decrement").mockResolvedValue({} as never)
    jest.spyOn(Receipt, "findOne").mockResolvedValue(receipt as never)

    await new RefundTransactionService().execute({
      transaction_id: transactionId,
      source: "manual",
      performed_by: financeUserId,
      reason: "Doadora pediu estorno",
      refund_on_gateway: false,
    })

    const [changes] = receipt.update.mock.calls[0]

    expect(changes.status).toBe("cancelled")
    expect(changes.cancelled_at).toBeInstanceOf(Date)
    // Cancelar não pode reescrever o documento assinado, senão todos os elos seguintes quebram.
    expect(changes).not.toHaveProperty("hash")
    expect(changes).not.toHaveProperty("previous_hash")
    expect(changes).not.toHaveProperty("amount")
  })

  it("serves the institutional receipt as a pdf on the public download route", async () => {
    const receipt = storedReceipt()
    jest.spyOn(Receipt, "findOne").mockResolvedValue(receipt as never)

    const req = mockRequest({ params: { hash: receipt.hash } } as never)
    const res = mockResponse()
    res.set = jest.fn().mockReturnValue(res)

    await new DownloadReceiptController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(200)

    const headers = (res.set as jest.Mock).mock.calls[0][0]
    expect(headers["Content-Type"]).toBe("application/pdf")
    expect(headers["Content-Disposition"]).toContain("recibo-2026-000002.pdf")

    const body = (res.send as jest.Mock).mock.calls[0][0]
    expect(body.subarray(0, 5).toString()).toBe("%PDF-")
    // Uma folha só. O template posiciona tudo em coordenada absoluta, e uma linha que encostasse
    // na margem inferior faria o pdfkit abrir uma segunda página em branco.
    expect(body.toString("latin1").match(/\/Type\s*\/Page[^s]/g)).toHaveLength(1)
  })

  it("serves the certificate on its own route, in landscape and without the donor document", async () => {
    const receipt = storedReceipt()
    jest.spyOn(Receipt, "findOne").mockResolvedValue(receipt as never)

    const req = mockRequest({ params: { hash: receipt.hash } } as never)
    const res = mockResponse()
    res.set = jest.fn().mockReturnValue(res)

    await new DownloadReceiptCertificateController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(200)

    const headers = (res.set as jest.Mock).mock.calls[0][0]
    expect(headers["Content-Disposition"]).toContain("certificado-2026-000002.pdf")

    const body = (res.send as jest.Mock).mock.calls[0][0]
    expect(body.subarray(0, 5).toString()).toBe("%PDF-")
    expect(body.toString("latin1").match(/\/Type\s*\/Page[^s]/g)).toHaveLength(1)
    // A4 deitado: 841.89 x 595.28. É o certificado, não o recibo institucional.
    expect(body.toString("latin1")).toContain("841.89 595.28")
  })

  it("renders a long company name without colliding with the text below it", async () => {
    const receipt = storedReceipt({
      donor_name: "Construtora Alvorada Participações e Empreendimentos Imobiliários LTDA",
      amount: "125000.90",
    })
    jest.spyOn(Receipt, "findOne").mockResolvedValue(receipt as never)

    for (const controller of [new DownloadReceiptController(), new DownloadReceiptCertificateController()]) {
      const req = mockRequest({ params: { hash: receipt.hash } } as never)
      const res = mockResponse()
      res.set = jest.fn().mockReturnValue(res)

      await controller.handle(req, res)

      const body = (res.send as jest.Mock).mock.calls[0][0]
      expect(body.toString("latin1").match(/\/Type\s*\/Page[^s]/g)).toHaveLength(1)
    }
  })
})
