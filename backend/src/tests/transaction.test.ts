import { BadRequestError } from "../config/errors.js";
import { StripeGateway } from "../config/stripe.js";
import { Campaign } from "../models/campaign-model.js";
import { Event } from "../models/event-model.js";
import { Product } from "../models/product-model.js";
import { Transaction } from "../models/transaction-model.js";
import { TransactionAuditLog } from "../models/transaction-audit-log-model.js";
import { TransactionItem } from "../models/transaction-item-model.js";
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
      items: [],
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
      items: [],
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
      items: [],
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

const productId = "5b8d3a1f-4c2e-4b9d-a710-6f3e8c2d5a91"

function catalogueProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: productId,
    name: "Camiseta Somos do Bem",
    price: "49.90",
    stock: 10,
    active: true,
    ...overrides,
  }
}

describe("Transaction pricing (where the amount is allowed to come from)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    mockSequelizeTransaction()

    jest.spyOn(CreateDonorService.prototype, "execute").mockResolvedValue({
      donor: { id: donorId, name: "Maria Oliveira", email: "maria@email.com" },
      created: true,
    } as never)

    jest.spyOn(TransactionAuditLog, "create").mockResolvedValue({} as never)
    jest.spyOn(TransactionItem, "bulkCreate").mockResolvedValue([] as never)

    jest.spyOn(StripeGateway.prototype, "createCheckoutSession").mockResolvedValue({
      gateway_checkout_id: "cs_test_abc",
      checkout_url: "https://checkout.stripe.com/c/pay/cs_test_abc",
    })
  })

  it("prices a purchase from the catalogue and writes the items with it", async () => {
    jest.spyOn(Product, "findAll").mockResolvedValue([catalogueProduct()] as never)
    jest.spyOn(Transaction, "create").mockResolvedValue(createdTransaction({ type: "product" }) as never)

    const req = mockRequest({
      body: {
        type: "product",
        items: [{ product_id: productId, quantity: 2 }],
        donor_name: "Maria Oliveira",
        donor_email: "maria@email.com",
      },
    })
    const res = mockResponse()

    await new CreateTransactionController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(201)

    // 2 x 49,90 somado em centavos inteiros: o valor da transação nasce do catálogo.
    expect(Transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "product", amount: "99.80" }),
      expect.anything()
    )

    // A linha copia nome e preço do produto no instante da compra.
    const [lines] = (TransactionItem.bulkCreate as jest.Mock).mock.calls[0]
    expect(lines).toEqual([
      expect.objectContaining({
        product_id: productId,
        description: "Camiseta Somos do Bem",
        quantity: 2,
        unit_price: "49.90",
      }),
    ])

    // O gateway cobra o valor calculado, nunca um valor que veio do cliente.
    expect(StripeGateway.prototype.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ amount: "99.80" })
    )
  })

  it("refuses a purchase that tries to set its own price", async () => {
    jest.spyOn(Product, "findAll").mockResolvedValue([catalogueProduct()] as never)
    jest.spyOn(Transaction, "create").mockResolvedValue(createdTransaction() as never)

    const req = mockRequest({
      body: {
        type: "product",
        amount: 0.01,
        items: [{ product_id: productId, quantity: 1 }],
        donor_name: "Maria Oliveira",
        donor_email: "maria@email.com",
      },
    })
    const res = mockResponse()

    await new CreateTransactionController().handle(req, res)

    // Comprar uma camiseta de R$ 49,90 por um centavo para na validação, e não em silêncio.
    expect(res.status).toHaveBeenCalledWith(400)
    expect(Transaction.create).not.toHaveBeenCalled()

    const body = (res.json as jest.Mock).mock.calls[0][0]
    expect(body.errors[0].path).toBe("amount")
  })

  it("keeps the free amount of a donation, which has no catalogue behind it", async () => {
    jest.spyOn(Transaction, "create").mockResolvedValue(createdTransaction() as never)

    const req = mockRequest({
      body: {
        type: "donation",
        amount: 37.5,
        donor_name: "Maria Oliveira",
        donor_email: "maria@email.com",
      },
    })
    const res = mockResponse()

    await new CreateTransactionController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(Transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: "37.50" }),
      expect.anything()
    )
    // Doação não tem item: não há o que itemizar num valor livre.
    expect(TransactionItem.bulkCreate).not.toHaveBeenCalled()
  })

  it("adds up repeated lines of the same product before checking the stock", async () => {
    jest.spyOn(Product, "findAll").mockResolvedValue([catalogueProduct({ stock: 3 })] as never)
    jest.spyOn(Transaction, "create").mockResolvedValue(createdTransaction() as never)

    // Duas linhas de 2 passam sozinhas por um estoque de 3, mas somam 4.
    await expect(new CreateTransactionService().execute({
      type: "product",
      items: [
        { product_id: productId, quantity: 2 },
        { product_id: productId, quantity: 2 },
      ],
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

  it("refuses a product that is no longer on sale", async () => {
    jest.spyOn(Product, "findAll").mockResolvedValue([catalogueProduct({ active: false })] as never)
    jest.spyOn(Transaction, "create").mockResolvedValue(createdTransaction() as never)

    await expect(new CreateTransactionService().execute({
      type: "product",
      items: [{ product_id: productId, quantity: 1 }],
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

  it("takes the ticket price from the event, not from the request", async () => {
    jest.spyOn(Event, "findByPk").mockResolvedValue({
      id: "event-1",
      title: "Jantar Beneficente 2026",
      status: "published",
      capacity: 50,
      taken_seats: 10,
      ticket_price: "120.00",
    } as never)
    jest.spyOn(Transaction, "create").mockResolvedValue(createdTransaction({ type: "ticket" }) as never)

    await new CreateTransactionService().execute({
      type: "ticket",
      items: [],
      campaign_id: null,
      event_id: "event-1",
      notes: null,
      donor_name: "Maria Oliveira",
      donor_email: "maria@email.com",
      donor_document: null,
      donor_phone: null,
    })

    expect(Transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "ticket", amount: "120.00" }),
      expect.anything()
    )

    // O convite também vira linha, com o nome do evento como descrição.
    const [lines] = (TransactionItem.bulkCreate as jest.Mock).mock.calls[0]
    expect(lines).toEqual([
      expect.objectContaining({
        product_id: null,
        description: "Jantar Beneficente 2026",
        quantity: 1,
        unit_price: "120.00",
      }),
    ])
  })
})

describe("Money validation (two decimal places in binary floating point)", () => {
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

  // 19.99 * 100 dá 1998.9999999999998 em ponto flutuante. A validação antiga usava
  // Number.isInteger sobre esse resultado e recusava 9% dos valores legítimos de dois decimais.
  it.each([19.99, 0.07, 1.1, 1.09, 0.55, 149.99])("accepts R$ %s, a valid two decimal amount", async (amount) => {
    jest.spyOn(Transaction, "create").mockResolvedValue(createdTransaction() as never)

    const req = mockRequest({
      body: { type: "donation", amount, donor_name: "Maria Oliveira", donor_email: "maria@email.com" },
    })
    const res = mockResponse()

    await new CreateTransactionController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(Transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: amount.toFixed(2) }),
      expect.anything()
    )
  })

  it.each([19.999, 0.001, 10.125])("still rejects R$ %s, which has more than two decimals", async (amount) => {
    jest.spyOn(Transaction, "create").mockResolvedValue(createdTransaction() as never)

    const req = mockRequest({
      body: { type: "donation", amount, donor_name: "Maria Oliveira", donor_email: "maria@email.com" },
    })
    const res = mockResponse()

    await new CreateTransactionController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(Transaction.create).not.toHaveBeenCalled()
  })
})

describe("Event capacity only guards what actually takes a seat", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    mockSequelizeTransaction()

    jest.spyOn(CreateDonorService.prototype, "execute").mockResolvedValue({
      donor: { id: donorId, name: "Maria Oliveira", email: "maria@email.com" },
      created: true,
    } as never)
    jest.spyOn(TransactionAuditLog, "create").mockResolvedValue({} as never)
    jest.spyOn(TransactionItem, "bulkCreate").mockResolvedValue([] as never)
    jest.spyOn(StripeGateway.prototype, "createCheckoutSession").mockResolvedValue({
      gateway_checkout_id: "cs_test_abc",
      checkout_url: "https://checkout.stripe.com/c/pay/cs_test_abc",
    })
    jest.spyOn(Event, "findByPk").mockResolvedValue({
      id: "event-1",
      title: "Jantar Beneficente 2026",
      status: "published",
      capacity: 50,
      taken_seats: 50,
      ticket_price: "120.00",
    } as never)
  })

  it("accepts a donation to a sold out event, which occupies no seat", async () => {
    jest.spyOn(Transaction, "create").mockResolvedValue(createdTransaction() as never)

    // Só o convite debita taken_seats na confirmação. Recusar uma doação por lotação era
    // recusar dinheiro que não disputa lugar nenhum.
    const created = await new CreateTransactionService().execute({
      type: "donation",
      amount: "80.00",
      items: [],
      campaign_id: null,
      event_id: "event-1",
      notes: null,
      donor_name: "Maria Oliveira",
      donor_email: "maria@email.com",
      donor_document: null,
      donor_phone: null,
    })

    expect(created.id).toBe(transactionId)
    expect(Transaction.create).toHaveBeenCalled()
  })

  it("still refuses a ticket for the same sold out event", async () => {
    jest.spyOn(Transaction, "create").mockResolvedValue(createdTransaction() as never)

    await expect(new CreateTransactionService().execute({
      type: "ticket",
      items: [],
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
})
