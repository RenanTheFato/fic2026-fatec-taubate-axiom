import { BadRequestError } from "../config/errors.js";
import { StripeGateway } from "../config/stripe.js";
import { Campaign } from "../models/campaign-model.js";
import { Event } from "../models/event-model.js";
import { Transaction } from "../models/transaction-model.js";
import { TransactionAuditLog } from "../models/transaction-audit-log-model.js";
import { CreateTransactionService } from "../services/transaction/create-transaction-service.js";
import { CreateDonorService } from "../services/donor/create-donor-service.js";
import { CreateTransactionController } from "../controllers/transaction/create-transaction-controller.js";
import { mockRequest, mockResponse } from "./utils/mock-http.js";
import { mockSequelizeTransaction } from "./utils/mock-sequelize.js";

const donorId = "donor-123"
const transactionId = "transaction-123"

function createdTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: transactionId,
    type: "donation",
    status: "pending",
    amount: "150.00",
    donor_id: donorId,
    campaign_id: null,
    event_id: null,
    update: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockReturnValue({ id: transactionId, status: "pending", amount: "150.00", ...overrides }),
    ...overrides,
  }
}

describe("Transaction checkout (donor form to Stripe checkout session)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    mockSequelizeTransaction()

    jest.spyOn(CreateDonorService.prototype, "execute").mockResolvedValue({
      donor: { id: donorId, name: "Maria Oliveira", email: "maria@email.com" },
      created: true,
    } as never)

    jest.spyOn(TransactionAuditLog, "create").mockResolvedValue({} as never)

    jest.spyOn(StripeGateway.prototype, "createCheckoutSession").mockResolvedValue({
      gateway_checkout_id: "cs_test_abc",
      checkout_url: "https://checkout.stripe.com/c/pay/cs_test_abc",
    })
  })

  it("creates a pending donation, logs it and returns a checkout url", async () => {
    const transaction = createdTransaction()
    jest.spyOn(Transaction, "create").mockResolvedValue(transaction as never)

    const req = mockRequest({
      body: {
        type: "donation",
        amount: 150,
        donor_name: "Maria Oliveira",
        donor_email: "maria@email.com",
      },
    })
    const res = mockResponse()

    await new CreateTransactionController().handle(req, res)

    // O valor chega como number e é gravado com duas casas, como no resto da API.
    expect(Transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending", amount: "150.00", donor_id: donorId }),
      expect.anything()
    )

    // Regra 3.1: nem a criação escapa do log de auditoria.
    expect(TransactionAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ previous_status: null, new_status: "pending", source: "system" }),
      expect.anything()
    )

    expect(transaction.update).toHaveBeenCalledWith({
      gateway_checkout_id: "cs_test_abc",
      checkout_url: "https://checkout.stripe.com/c/pay/cs_test_abc",
    })

    expect(res.status).toHaveBeenCalledWith(201)
  })

  it("refuses a ticket transaction that carries no event", async () => {
    jest.spyOn(Transaction, "create").mockResolvedValue(createdTransaction() as never)

    await expect(new CreateTransactionService().execute({
      type: "ticket",
      amount: "120.00",
      campaign_id: null,
      event_id: null,
      notes: null,
      donor_name: "Maria Oliveira",
      donor_email: "maria@email.com",
      donor_document: null,
      donor_phone: null,
    })).rejects.toBeInstanceOf(BadRequestError)

    expect(Transaction.create).not.toHaveBeenCalled()
  })

  it("refuses a donation to a campaign that is not active", async () => {
    jest.spyOn(Campaign, "findByPk").mockResolvedValue({ id: "campaign-1", status: "draft" } as never)
    jest.spyOn(Transaction, "create").mockResolvedValue(createdTransaction() as never)

    await expect(new CreateTransactionService().execute({
      type: "donation",
      amount: "150.00",
      campaign_id: "campaign-1",
      event_id: null,
      notes: null,
      donor_name: "Maria Oliveira",
      donor_email: "maria@email.com",
      donor_document: null,
      donor_phone: null,
    })).rejects.toBeInstanceOf(BadRequestError)

    expect(Transaction.create).not.toHaveBeenCalled()
  })

  it("refuses a ticket for an event that is already full", async () => {
    jest.spyOn(Event, "findByPk").mockResolvedValue({
      id: "event-1",
      status: "published",
      capacity: 50,
      taken_seats: 50,
    } as never)
    jest.spyOn(Transaction, "create").mockResolvedValue(createdTransaction() as never)

    await expect(new CreateTransactionService().execute({
      type: "ticket",
      amount: "120.00",
      campaign_id: null,
      event_id: "event-1",
      notes: null,
      donor_name: "Maria Oliveira",
      donor_email: "maria@email.com",
      donor_document: null,
      donor_phone: null,
    })).rejects.toBeInstanceOf(BadRequestError)

    expect(Transaction.create).not.toHaveBeenCalled()
  })

  it("rejects an amount with more than two decimal places before touching the database", async () => {
    jest.spyOn(Transaction, "create").mockResolvedValue(createdTransaction() as never)

    const req = mockRequest({
      body: {
        type: "donation",
        amount: 150.999,
        donor_name: "Maria Oliveira",
        donor_email: "maria@email.com",
      },
    })
    const res = mockResponse()

    await new CreateTransactionController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(Transaction.create).not.toHaveBeenCalled()
  })
})
