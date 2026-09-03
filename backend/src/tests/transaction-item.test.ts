import { Op } from "sequelize";
import { TransactionItem } from "../models/transaction-item-model.js";
import { ListTransactionItemsController } from "../controllers/transaction-item/list-transaction-items-controller.js";
import { SummarizeTransactionItemsController } from "../controllers/transaction-item/summarize-transaction-items-controller.js";
import { mockRequest, mockResponse } from "./utils/mock-http.js";

// UUIDs de verdade: o filtro é validado com z.uuid() antes de chegar ao banco.
const transactionId = "7a2e5c1b-9d3f-4a6e-b810-2c4f7d9a1e53"
const productId = "5b8d3a1f-4c2e-4b9d-a710-6f3e8c2d5a91"

function soldItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "item-1",
    transaction_id: transactionId,
    product_id: productId,
    description: "Camiseta Somos do Bem tamanho M",
    quantity: 2,
    unit_price: "49.90",
    ...overrides,
  }
}

describe("Transaction item listing (the itemisation behind the financial panel)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("lists the items of one transaction, paginated and filtered", async () => {
    jest.spyOn(TransactionItem, "findAndCountAll").mockResolvedValue({
      rows: [soldItem()],
      count: 1,
    } as never)

    const req = mockRequest({
      user: { id: "user-finance-1" },
      query: { transaction_id: transactionId, page: "1", limit: "10" },
    } as never)
    const res = mockResponse()

    await new ListTransactionItemsController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(200)

    // page e limit chegam como string na query e precisam de z.coerce para virarem número.
    const options = (TransactionItem.findAndCountAll as jest.Mock).mock.calls[0][0]
    expect(options.where).toEqual({ transaction_id: transactionId })
    expect(options.limit).toBe(10)
    expect(options.offset).toBe(0)

    const body = (res.json as jest.Mock).mock.calls[0][0]
    expect(body.total).toBe(1)
    // O preço da linha é cópia da compra, não o preço atual do catálogo.
    expect(body.items[0].unit_price).toBe("49.90")
  })

  it("rejects a filter that is not a valid uuid before touching the database", async () => {
    jest.spyOn(TransactionItem, "findAndCountAll").mockResolvedValue({ rows: [], count: 0 } as never)

    const req = mockRequest({
      user: { id: "user-finance-1" },
      query: { product_id: "nao-e-uuid" },
    } as never)
    const res = mockResponse()

    await new ListTransactionItemsController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(TransactionItem.findAndCountAll).not.toHaveBeenCalled()

    const body = (res.json as jest.Mock).mock.calls[0][0]
    expect(body.error).toBe("Validation Errors Occurred")
    expect(body.errors[0].path).toBe("product_id")
  })
})

describe("Transaction item summary (how much each product sold and raised)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("aggregates per product, counting only money that actually came in", async () => {
    // Duas chamadas: a primeira agrupada por produto, a segunda com os totais do periodo.
    jest.spyOn(TransactionItem, "findAll")
      .mockResolvedValueOnce([
        { product_id: productId, description: "Camiseta Somos do Bem", quantity: "3", revenue: "149.70", transactions: "2" },
        { product_id: null, description: "Caneca", quantity: "1", revenue: "24.95", transactions: "1" },
      ] as never)
      .mockResolvedValueOnce([
        { quantity: "4", revenue: "174.65", transactions: "2" },
      ] as never)

    const req = mockRequest({
      user: { id: "user-finance-1" },
      query: { type: "product", from: "2026-01-01T00:00:00.000Z" },
    } as never)
    const res = mockResponse()

    await new SummarizeTransactionItemsController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(200)

    const options = (TransactionItem.findAll as jest.Mock).mock.calls[0][0]

    // Uma transacao pendente nunca entrou e um estorno sai de "confirmed" sozinho.
    expect(options.include[0].where.status).toBe("confirmed")
    expect(options.include[0].required).toBe(true)
    expect(options.include[0].where.type).toBe("product")

    // O recorte de data é pela confirmação, que é quando o dinheiro chegou,
    // e não pela data em que a linha foi escrita.
    expect(options.include[0].where.confirmed_at[Op.gte]).toEqual(new Date("2026-01-01T00:00:00.000Z"))
    expect(options.where.created_at).toBeUndefined()

    expect(options.group).toEqual(["TransactionItem.product_id", "TransactionItem.description"])

    const body = (res.json as jest.Mock).mock.calls[0][0]
    // Quantidade é contagem e vira número; dinheiro continua string, somado no SQL.
    expect(body.summary[0]).toEqual({
      product_id: productId,
      description: "Camiseta Somos do Bem",
      quantity: 3,
      revenue: "149.70",
      transactions: 2,
    })
    expect(body.totals).toEqual({ products: 2, quantity: 4, revenue: "174.65", transactions: 2 })
  })

  it("reports zero, not null, for a period with no confirmed sale", async () => {
    // SUM sobre conjunto vazio devolve null no MySQL; o relatório não pode vazar isso.
    jest.spyOn(TransactionItem, "findAll")
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([{ quantity: null, revenue: null, transactions: "0" }] as never)

    const req = mockRequest({ user: { id: "user-finance-1" }, query: {} } as never)
    const res = mockResponse()

    await new SummarizeTransactionItemsController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(200)

    const body = (res.json as jest.Mock).mock.calls[0][0]
    expect(body.summary).toEqual([])
    expect(body.totals).toEqual({ products: 0, quantity: 0, revenue: "0.00", transactions: 0 })
  })

  it("rejects an unknown transaction type before touching the database", async () => {
    jest.spyOn(TransactionItem, "findAll").mockResolvedValue([] as never)

    const req = mockRequest({
      user: { id: "user-finance-1" },
      query: { type: "pix" },
    } as never)
    const res = mockResponse()

    await new SummarizeTransactionItemsController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(TransactionItem.findAll).not.toHaveBeenCalled()

    const body = (res.json as jest.Mock).mock.calls[0][0]
    expect(body.errors[0].path).toBe("type")
  })
})
