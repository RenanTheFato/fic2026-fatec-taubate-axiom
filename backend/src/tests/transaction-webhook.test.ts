import { createHmac } from "node:crypto";
import Stripe from "stripe";
import { env } from "../config/env.js";
import { StripeGateway } from "../config/stripe.js";
import { Transaction } from "../models/transaction-model.js";
import { TransactionAuditLog } from "../models/transaction-audit-log-model.js";
import { Campaign } from "../models/campaign-model.js";
import { ConfirmTransactionService } from "../services/transaction/confirm-transaction-service.js";
import { ProcessTransactionWebhookService } from "../services/transaction/process-transaction-webhook-service.js";
import { TransactionWebhookController } from "../controllers/transaction/transaction-webhook-controller.js";
import { mockRequest, mockResponse } from "./utils/mock-http.js";
import { mockSequelizeTransaction } from "./utils/mock-sequelize.js";
import { TransactionItem } from "../models/transaction-item-model.js";
import { Product } from "../models/product-model.js";

const transactionId = "transaction-123"
const paymentIntentId = "pi_3PabcDEfGhIjKlMn"

function checkoutCompletedEvent(paymentStatus = "paid") {
  return {
    id: "evt_1PabcDEfGhIjKlMn",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_abc",
        client_reference_id: transactionId,
        payment_status: paymentStatus,
        payment_intent: paymentIntentId,
      },
    },
  }
}

// A assinatura é montada com o mesmo segredo e o mesmo esquema do Stripe ("t=<ts>,v1=<hmac>"
// sobre "<ts>.<corpo cru>"), então o controller roda a verificação de verdade em vez de recebê-la
// mockada: é justamente a checagem que impede um estranho de confirmar transação.
function signedRequest(event: object) {
  const payload = Buffer.from(JSON.stringify(event))
  const ts = Math.floor(Date.now() / 1000)
  const hash = createHmac("sha256", env.STRIPE_WEBHOOK_SECRET).update(`${ts}.${payload.toString()}`).digest("hex")

  return mockRequest({
    body: payload,
    headers: { "stripe-signature": `t=${ts},v1=${hash}` },
  })
}

function gatewayPayment(status: string, overrides: Record<string, unknown> = {}) {
  return jest.spyOn(StripeGateway.prototype, "getPayment").mockResolvedValue({
    gateway_payment_id: paymentIntentId,
    status,
    payment_method: "pix",
    amount_cents: 15000,
    refunded_cents: 0,
    partially_refunded: false,
    transaction_id: transactionId,
    ...overrides,
  } as never)
}

function foundTransaction(overrides: Record<string, unknown> = {}) {
  const transaction = {
    id: transactionId,
    type: "donation",
    status: "pending",
    amount: "150.00",
    campaign_id: "campaign-1",
    event_id: null,
    update: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockReturnValue({ id: transactionId }),
    ...overrides,
  }

  jest.spyOn(Transaction, "findByPk").mockResolvedValue(transaction as never)
  return transaction
}

describe("Stripe webhook (signature, idempotency and status dispatch)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    mockSequelizeTransaction()

    jest.spyOn(TransactionAuditLog, "create").mockResolvedValue({} as never)
    // A confirmação lê os itens para debitar estoque.
    jest.spyOn(TransactionItem, "findAll").mockResolvedValue([] as never)
    jest.spyOn(Product, "update").mockResolvedValue([1] as never)
    jest.spyOn(Campaign, "increment").mockResolvedValue({} as never)
  })

  it("rejects an event whose signature does not match the webhook secret", async () => {
    const spy = jest.spyOn(ProcessTransactionWebhookService.prototype, "execute")

    const req = mockRequest({
      body: Buffer.from(JSON.stringify(checkoutCompletedEvent())),
      headers: { "stripe-signature": "t=1700000000,v1=deadbeef" },
    })
    const res = mockResponse()

    await new TransactionWebhookController().handle(req, res)

    // A assinatura é o que faz o papel do token nesta rota: sem ela, qualquer um confirmaria
    // transação. A checagem acontece antes de qualquer consulta ao banco.
    expect(res.status).toHaveBeenCalledWith(401)
    expect(spy).not.toHaveBeenCalled()
  })

  it("accepts a correctly signed event and confirms the transaction", async () => {
    gatewayPayment("confirmed")
    foundTransaction({ status: "pending" })

    const res = mockResponse()

    await new TransactionWebhookController().handle(signedRequest(checkoutCompletedEvent()), res)

    // Regra 3.1: o status vem da consulta à API, nunca do que veio escrito no evento.
    expect(StripeGateway.prototype.getPayment).toHaveBeenCalledWith(paymentIntentId)
    expect(Campaign.increment).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it("ignores a repeated event instead of raising the campaign total twice", async () => {
    gatewayPayment("confirmed")
    foundTransaction({ status: "confirmed" })

    const result = await new ProcessTransactionWebhookService().execute({
      event: checkoutCompletedEvent() as unknown as Stripe.Event,
    })

    // O Stripe reenvia o mesmo evento: reprocessar somaria a arrecadação de novo.
    expect(result.processed).toBe(false)
    expect(Campaign.increment).not.toHaveBeenCalled()
  })

  it("acknowledges an event type that does not describe a payment", async () => {
    const getPayment = jest.spyOn(StripeGateway.prototype, "getPayment")

    const result = await new ProcessTransactionWebhookService().execute({
      event: { id: "evt_2", type: "customer.created", data: { object: {} } } as unknown as Stripe.Event,
    })

    expect(result.processed).toBe(false)
    expect(getPayment).not.toHaveBeenCalled()
  })

  it("answers 200 for an unknown transaction so the gateway stops retrying", async () => {
    gatewayPayment("confirmed")
    jest.spyOn(Transaction, "findByPk").mockResolvedValue(null as never)

    const res = mockResponse()

    await new TransactionWebhookController().handle(signedRequest(checkoutCompletedEvent()), res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ processed: false }))
  })

  it("records a payment still in transit without applying any financial effect", async () => {
    gatewayPayment("awaiting_confirmation")
    const transaction = foundTransaction({ status: "pending" })
    const confirm = jest.spyOn(ConfirmTransactionService.prototype, "execute")

    // Pix e boleto fecham a sessão antes de o dinheiro cair: a vaga e a arrecadação ficam para
    // o async_payment_succeeded que vem depois.
    await new ProcessTransactionWebhookService().execute({
      event: checkoutCompletedEvent("unpaid") as unknown as Stripe.Event,
    })

    expect(confirm).not.toHaveBeenCalled()
    expect(Campaign.increment).not.toHaveBeenCalled()
    expect(transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "awaiting_confirmation", gateway_payment_id: paymentIntentId }),
      expect.anything()
    )
    expect(TransactionAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ new_status: "awaiting_confirmation", source: "webhook", performed_by: null }),
      expect.anything()
    )
  })

  it("cancels the transaction when the checkout session expires", async () => {
    const transaction = foundTransaction({ status: "pending" })
    const getPayment = jest.spyOn(StripeGateway.prototype, "getPayment")

    const result = await new ProcessTransactionWebhookService().execute({
      event: {
        id: "evt_3",
        type: "checkout.session.expired",
        data: { object: { id: "cs_test_abc", client_reference_id: transactionId, payment_intent: null } },
      } as unknown as Stripe.Event,
    })

    // Sessão expirada não tem PaymentIntent para consultar: o desfecho é o próprio evento.
    expect(getPayment).not.toHaveBeenCalled()
    expect(result.processed).toBe(true)
    expect(transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "cancelled" }),
      expect.anything()
    )
  })
})

describe("Webhook money integrity (what the gateway says versus what we recorded)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    mockSequelizeTransaction()

    jest.spyOn(TransactionAuditLog, "create").mockResolvedValue({} as never)
    jest.spyOn(Campaign, "increment").mockResolvedValue({} as never)
    jest.spyOn(Campaign, "decrement").mockResolvedValue({} as never)
    jest.spyOn(TransactionItem, "findAll").mockResolvedValue([] as never)
    jest.spyOn(Product, "update").mockResolvedValue([1] as never)
  })

  it("refuses to confirm when the paid amount does not match the recorded amount", async () => {
    foundTransaction({ status: "pending", amount: "150.00" })
    // O gateway diz que entraram R$ 1,00 numa transação registrada como R$ 150,00.
    gatewayPayment("confirmed", { amount_cents: 100 })

    const req = signedRequest({
      id: "evt_1", type: "checkout.session.completed",
      data: { object: { client_reference_id: transactionId, payment_intent: paymentIntentId, payment_status: "paid" } },
    })
    const res = mockResponse()

    await new TransactionWebhookController().handle(req, res)

    // Responde 200 para o Stripe parar de reenviar, mas nada de dinheiro é aplicado.
    expect(res.status).toHaveBeenCalledWith(200)
    expect(Campaign.increment).not.toHaveBeenCalled()

    const body = (res.json as jest.Mock).mock.calls[0][0]
    expect(body.processed).toBe(false)
    expect(body.reason).toContain("does not match")
  })

  it("does not reverse a whole purchase because of a partial refund", async () => {
    foundTransaction({ status: "confirmed", amount: "150.00" })
    // Devolveram R$ 10 de uma compra de R$ 150: não é estorno, é ajuste.
    gatewayPayment("confirmed", { refunded_cents: 1000, partially_refunded: true })

    const req = signedRequest({
      id: "evt_2", type: "charge.refunded",
      data: { object: { payment_intent: paymentIntentId } },
    })
    const res = mockResponse()

    await new TransactionWebhookController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    // A arrecadação da campanha não é decrementada pelo valor inteiro.
    expect(Campaign.decrement).not.toHaveBeenCalled()

    const body = (res.json as jest.Mock).mock.calls[0][0]
    expect(body.processed).toBe(false)
    expect(body.reason).toContain("Partial refund")
  })
})

describe("Status only moves forward (Stripe redelivers out of order)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    mockSequelizeTransaction()

    jest.spyOn(TransactionAuditLog, "create").mockResolvedValue({} as never)
    jest.spyOn(Campaign, "increment").mockResolvedValue({} as never)
    jest.spyOn(TransactionItem, "findAll").mockResolvedValue([] as never)
    jest.spyOn(Product, "update").mockResolvedValue([1] as never)
  })

  it("does not downgrade an already confirmed transaction to a pending status", async () => {
    // O evento antigo chega depois da confirmação: sem reler sob trava, ele rebaixaria uma
    // transação com recibo já emitido e arrecadação já somada.
    const transaction = foundTransaction({ status: "confirmed" })
    gatewayPayment("pending")

    const req = signedRequest({
      id: "evt_late", type: "checkout.session.completed",
      data: { object: { client_reference_id: transactionId, payment_intent: paymentIntentId, payment_status: "unpaid" } },
    })
    const res = mockResponse()

    await new TransactionWebhookController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(transaction.update).not.toHaveBeenCalled()
    expect(TransactionAuditLog.create).not.toHaveBeenCalled()

    const body = (res.json as jest.Mock).mock.calls[0][0]
    expect(body.processed).toBe(false)
    expect(body.reason).toContain("already moved past")
  })
})
