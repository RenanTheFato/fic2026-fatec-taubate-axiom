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
import { TransactionItem } from "../models/transaction-item-model.js";
import { Product } from "../models/product-model.js";
import { ReceiptSequence } from "../models/receipt-sequence-model.js";

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
    // Confirmação e estorno agora leem os itens para debitar e devolver estoque.
    jest.spyOn(TransactionItem, "findAll").mockResolvedValue([] as never)
    jest.spyOn(Product, "update").mockResolvedValue([1] as never)
    jest.spyOn(Campaign, "increment").mockResolvedValue({} as never)
    jest.spyOn(Campaign, "decrement").mockResolvedValue({} as never)
    jest.spyOn(Event, "update").mockResolvedValue([1] as never)
    jest.spyOn(StripeGateway.prototype, "refundPayment").mockResolvedValue(undefined)

    // A confirmação emite o recibo dentro da mesma transação de banco, então o ciclo de vida
    // também precisa da ponta do recibo de mentira.
    jest.spyOn(Donor, "findByPk").mockResolvedValue({ id: "donor-123", name: "Maria Oliveira", document: null } as never)
    // A emissão trava a linha única do alocador antes de calcular a sequência.
    jest.spyOn(ReceiptSequence, "findByPk").mockResolvedValue({
      last_sequence: 0,
      update: jest.fn().mockResolvedValue(undefined),
    } as never)
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

const productId = "5b8d3a1f-4c2e-4b9d-a710-6f3e8c2d5a91"

function soldLine(overrides: Record<string, unknown> = {}) {
  return { product_id: productId, description: "Camiseta Somos do Bem", quantity: 2, ...overrides }
}

describe("Stock as a finite resource (rule 3.3)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    mockSequelizeTransaction()

    jest.spyOn(TransactionAuditLog, "create").mockResolvedValue({} as never)
    jest.spyOn(Campaign, "increment").mockResolvedValue({} as never)
    jest.spyOn(Campaign, "decrement").mockResolvedValue({} as never)
    jest.spyOn(StripeGateway.prototype, "refundPayment").mockResolvedValue(undefined)
    jest.spyOn(Donor, "findByPk").mockResolvedValue({ id: "donor-123", name: "Maria Oliveira", document: null } as never)
    // A emissão trava a linha única do alocador antes de calcular a sequência.
    jest.spyOn(ReceiptSequence, "findByPk").mockResolvedValue({
      last_sequence: 0,
      update: jest.fn().mockResolvedValue(undefined),
    } as never)
    jest.spyOn(Receipt, "findOne").mockResolvedValue(null)
    jest.spyOn(Receipt, "create").mockImplementation((async (values: Record<string, unknown>) => ({
      get: () => values,
    })) as never)
    jest.spyOn(Receipt, "update").mockResolvedValue([1] as never)
  })

  it("debits the stock on confirmation with a conditional update, never a read-decide-write", async () => {
    const transaction = foundTransaction({ status: "pending", type: "product", campaign_id: null })
    jest.spyOn(TransactionItem, "findAll").mockResolvedValue([soldLine()] as never)
    const update = jest.spyOn(Product, "update").mockResolvedValue([1] as never)

    await new ConfirmTransactionService().execute({
      transaction_id: transactionId,
      source: "webhook",
      performed_by: null,
      reason: "Stripe confirmou",
    })

    // A decisão é do banco: a condição de estoque viaja dentro do próprio UPDATE.
    const [values, options] = update.mock.calls[0] as unknown as [{ stock: { val: string } }, { where: Record<string, unknown> }]
    expect(values.stock.val).toBe("stock - 2")
    expect(options.where).toMatchObject({ id: productId })

    expect(transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "confirmed" }),
      expect.anything()
    )
  })

  it("refuses the confirmation when the conditional update affects no row", async () => {
    const transaction = foundTransaction({ status: "pending", type: "product", campaign_id: null })
    jest.spyOn(TransactionItem, "findAll").mockResolvedValue([soldLine()] as never)
    // Zero linhas afetadas é a segunda compra do último item chegando: quem confirmou primeiro levou.
    jest.spyOn(Product, "update").mockResolvedValue([0] as never)

    await expect(new ConfirmTransactionService().execute({
      transaction_id: transactionId,
      source: "webhook",
      performed_by: null,
      reason: "Stripe confirmou",
    })).rejects.toBeInstanceOf(BadRequestError)

    // A transação inteira volta atrás: sem confirmação, sem recibo, sem log.
    expect(transaction.update).not.toHaveBeenCalled()
    expect(Receipt.create).not.toHaveBeenCalled()
    expect(TransactionAuditLog.create).not.toHaveBeenCalled()
  })

  it("gives the stock back when the purchase is refunded", async () => {
    foundTransaction({ status: "confirmed", type: "product", campaign_id: null, gateway_payment_id: "pi_1" })
    jest.spyOn(TransactionItem, "findAll").mockResolvedValue([soldLine({ quantity: 3 })] as never)
    const update = jest.spyOn(Product, "update").mockResolvedValue([1] as never)

    await new RefundTransactionService().execute({
      transaction_id: transactionId,
      source: "manual",
      performed_by: userId,
      reason: "Cliente desistiu",
    })

    const [values] = update.mock.calls[0] as unknown as [{ stock: { val: string } }]
    expect(values.stock.val).toBe("stock + 3")
  })

  it("locks the products in a stable order so two confirmations cannot deadlock", async () => {
    foundTransaction({ status: "pending", type: "product", campaign_id: null })
    const findAll = jest.spyOn(TransactionItem, "findAll").mockResolvedValue([] as never)
    jest.spyOn(Product, "update").mockResolvedValue([1] as never)

    await new ConfirmTransactionService().execute({
      transaction_id: transactionId,
      source: "webhook",
      performed_by: null,
      reason: "Stripe confirmou",
    })

    expect(findAll.mock.calls[0][0]).toMatchObject({ order: [["product_id", "ASC"]] })
  })
})
