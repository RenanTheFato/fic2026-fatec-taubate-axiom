import { BadRequestError, NotFoundError } from "../config/errors.js";
import { StripeGateway } from "../config/stripe.js";
import { Campaign } from "../models/campaign-model.js";
import { Donor } from "../models/donor-model.js";
import { Receipt } from "../models/receipt-model.js";
import { Event } from "../models/event-model.js";
import { Transaction } from "../models/transaction-model.js";
import { TransactionAuditLog } from "../models/transaction-audit-log-model.js";
import { CancelTransactionService } from "../services/transaction/cancel-transaction-service.js";
import { ConfirmTransactionService } from "../services/transaction/confirm-transaction-service.js";
import { RefundTransactionService } from "../services/transaction/refund-transaction-service.js";
import { RefuseTransactionService } from "../services/transaction/refuse-transaction-service.js";
import { mockSequelizeTransaction } from "./utils/mock-sequelize.js";

const transactionId = "transaction-123"
const userId = "user-123"

function foundTransaction(overrides: Record<string, unknown> = {}) {
  const transaction = {
    id: transactionId,
    type: "donation",
    status: "pending",
    amount: "150.00",
    donor_id: "donor-123",
    campaign_id: "campaign-1",
    event_id: null,
    gateway_payment_id: null,
    update: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockReturnValue({ id: transactionId, ...overrides }),
    ...overrides,
  }

  jest.spyOn(Transaction, "findByPk").mockResolvedValue(transaction as never)
  return transaction
}

describe("Transaction status lifecycle (pending to confirmed to refunded)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    mockSequelizeTransaction()

    jest.spyOn(TransactionAuditLog, "create").mockResolvedValue({} as never)
    jest.spyOn(Campaign, "increment").mockResolvedValue({} as never)
    jest.spyOn(Campaign, "decrement").mockResolvedValue({} as never)
    jest.spyOn(Event, "update").mockResolvedValue([1] as never)
    jest.spyOn(StripeGateway.prototype, "refundPayment").mockResolvedValue(undefined)

    // A confirmação emite o recibo dentro da mesma transação de banco, então o ciclo de vida
    // também precisa da ponta do recibo de mentira.
    jest.spyOn(Donor, "findByPk").mockResolvedValue({ id: "donor-123", name: "Maria Oliveira", document: null } as never)
    jest.spyOn(Receipt, "findOne").mockResolvedValue(null)
    jest.spyOn(Receipt, "create").mockImplementation((async (values: Record<string, unknown>) => ({
      get: () => values,
    })) as never)
  })

  it("confirms a pending donation, raises the campaign total and writes the audit record", async () => {
    const transaction = foundTransaction({ status: "pending" })

    await new ConfirmTransactionService().execute({
      transaction_id: transactionId,
      source: "manual",
      performed_by: userId,
      reason: "Comprovante conferido",
    })

    // Regra 3.1: a arrecadação da campanha sobe na mesma operação da confirmação, e a soma é
    // feita no SQL, não lendo e escrevendo no Node.
    expect(Campaign.increment).toHaveBeenCalledWith(
      { raised_amount: 150 },
      expect.objectContaining({ where: { id: "campaign-1" } })
    )

    expect(transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "confirmed", confirmed_at: expect.any(Date) }),
      expect.anything()
    )

    expect(TransactionAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        previous_status: "pending",
        new_status: "confirmed",
        source: "manual",
        performed_by: userId,
      }),
      expect.anything()
    )
  })

  it("takes one event seat when the confirmed transaction is a ticket", async () => {
    foundTransaction({ status: "pending", type: "ticket", event_id: "event-1", campaign_id: null })

    await new ConfirmTransactionService().execute({
      transaction_id: transactionId,
      source: "manual",
      performed_by: userId,
      reason: null,
    })

    // A vaga é debitada só aqui (regra 3.3) e num UPDATE condicional, não lendo taken_seats antes.
    expect(Event.update).toHaveBeenCalledWith(
      expect.objectContaining({ taken_seats: expect.anything() }),
      expect.objectContaining({ where: expect.objectContaining({ id: "event-1" }) })
    )
    expect(Campaign.increment).not.toHaveBeenCalled()
  })

  it("refuses the confirmation when the conditional seat update touched no row", async () => {
    foundTransaction({ status: "pending", type: "ticket", event_id: "event-1", campaign_id: null })
    jest.spyOn(Event, "update").mockResolvedValue([0] as never)

    await expect(new ConfirmTransactionService().execute({
      transaction_id: transactionId,
      source: "webhook",
      performed_by: null,
      reason: null,
    })).rejects.toBeInstanceOf(BadRequestError)

    // A trava do último convite: quem chega depois não confirma, e nada é gravado.
    expect(TransactionAuditLog.create).not.toHaveBeenCalled()
  })

  it("refuses to confirm a transaction that is already confirmed", async () => {
    foundTransaction({ status: "confirmed" })

    await expect(new ConfirmTransactionService().execute({
      transaction_id: transactionId,
      source: "manual",
      performed_by: userId,
      reason: null,
    })).rejects.toBeInstanceOf(BadRequestError)

    expect(Campaign.increment).not.toHaveBeenCalled()
    expect(TransactionAuditLog.create).not.toHaveBeenCalled()
  })

  it("answers not found when the transaction does not exist", async () => {
    jest.spyOn(Transaction, "findByPk").mockResolvedValue(null as never)

    await expect(new ConfirmTransactionService().execute({
      transaction_id: "missing",
      source: "manual",
      performed_by: userId,
      reason: null,
    })).rejects.toBeInstanceOf(NotFoundError)
  })

  it("refunds a confirmed donation, reverses the campaign total and keeps the row", async () => {
    const transaction = foundTransaction({ status: "confirmed", gateway_payment_id: "payment-abc" })

    await new RefundTransactionService().execute({
      transaction_id: transactionId,
      source: "manual",
      performed_by: userId,
      reason: "Doador pediu estorno",
    })

    expect(StripeGateway.prototype.refundPayment).toHaveBeenCalledWith("payment-abc")

    expect(Campaign.decrement).toHaveBeenCalledWith(
      { raised_amount: 150 },
      expect.objectContaining({ where: { id: "campaign-1" } })
    )

    // Regra 3.1: o estorno reverte os efeitos, nunca apaga a transação original.
    expect(transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "refunded", refunded_at: expect.any(Date) }),
      expect.anything()
    )
  })

  it("refuses to refund a transaction that was never confirmed", async () => {
    foundTransaction({ status: "pending" })

    await expect(new RefundTransactionService().execute({
      transaction_id: transactionId,
      source: "manual",
      performed_by: userId,
      reason: null,
    })).rejects.toBeInstanceOf(BadRequestError)

    expect(StripeGateway.prototype.refundPayment).not.toHaveBeenCalled()
    expect(Campaign.decrement).not.toHaveBeenCalled()
  })

  it("does not touch the database when the gateway refund fails", async () => {
    foundTransaction({ status: "confirmed", gateway_payment_id: "payment-abc" })
    jest.spyOn(StripeGateway.prototype, "refundPayment").mockRejectedValue(new Error("gateway down"))

    await expect(new RefundTransactionService().execute({
      transaction_id: transactionId,
      source: "manual",
      performed_by: userId,
      reason: null,
    })).rejects.toThrow("gateway down")

    expect(Campaign.decrement).not.toHaveBeenCalled()
    expect(TransactionAuditLog.create).not.toHaveBeenCalled()
  })

  it("refuses and cancels a pending transaction without any financial side effect", async () => {
    foundTransaction({ status: "pending" })
    await new RefuseTransactionService().execute({
      transaction_id: transactionId,
      source: "webhook",
      performed_by: null,
      reason: null,
    })

    foundTransaction({ status: "pending" })
    await new CancelTransactionService().execute({
      transaction_id: transactionId,
      source: "manual",
      performed_by: userId,
      reason: null,
    })

    expect(Campaign.increment).not.toHaveBeenCalled()
    expect(Campaign.decrement).not.toHaveBeenCalled()
    expect(TransactionAuditLog.create).toHaveBeenCalledTimes(2)
  })

  it("refuses to cancel a transaction that is already confirmed", async () => {
    foundTransaction({ status: "confirmed" })

    await expect(new CancelTransactionService().execute({
      transaction_id: transactionId,
      source: "manual",
      performed_by: userId,
      reason: null,
    })).rejects.toBeInstanceOf(BadRequestError)
  })
})
