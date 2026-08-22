import { Op } from "sequelize";
import { CreateProductController } from "../controllers/product/create-product-controller.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { Product } from "../models/product-model.js";
import { CreateProductService } from "../services/product/create-product-service.js";
import { ListProductsController } from "../controllers/product/list-products-controller.js";
import { ListAllProductsController } from "../controllers/product/list-all-products-controller.js";
import { UpdateProductController } from "../controllers/product/update-product-controller.js";
import { UpdateProductService } from "../services/product/update-product-service.js";
import { ActivateProductService } from "../services/product/activate-product-service.js";
import { DeactivateProductController } from "../controllers/product/deactivate-product-controller.js";
import { UpdateProductStockController } from "../controllers/product/update-product-stock-controller.js";
import { GetProductByIdController } from "../controllers/product/get-product-by-id-controller.js";
import { mockRequest, mockResponse } from "./utils/mock-http.js";

describe("Product creation guarded by role (real staff journey)", () => {
  const payload = {
    name: "Camiseta Somos do Bem",
    sku: "cam-01-m",
    description: "Camiseta 100% algodão, estampa serigrafada.",
    price: 89.90,
    stock: 50,
    image_url: "https://cdn.somosdobem.org/produtos/camiseta.jpg",
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("lets a staff user through the guard and creates the product inactive", async () => {
    const guard = RoleMiddleware("admin", "staff")

    const guardReq = mockRequest({ user: { id: "user-123", role: "staff" } })
    const guardRes = mockResponse()
    const next = jest.fn()

    guard(guardReq, guardRes, next)

    expect(next).toHaveBeenCalled()
    expect(guardRes.status).not.toHaveBeenCalled()

    jest.spyOn(Product, "findOne").mockResolvedValue(null)
    const create = jest.spyOn(Product, "create").mockResolvedValue({
      get: () => ({ id: "product-123", name: payload.name, sku: "CAM-01-M", active: false }),
    } as any)

    const createReq = mockRequest({ body: payload, user: { id: "user-123", role: "staff" } })
    const createRes = mockResponse()

    await new CreateProductController().handle(createReq, createRes)

    expect(createRes.status).toHaveBeenCalledWith(201)
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ price: "89.90", sku: "CAM-01-M", active: false })
    )
    expect(createRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ product: expect.objectContaining({ active: false }) })
    )
  })

  it("never reaches the controller when the authenticated user is a volunteer", async () => {
    const guard = RoleMiddleware("admin", "staff")

    const guardReq = mockRequest({ user: { id: "user-456", role: "volunteer" } })
    const guardRes = mockResponse()
    const next = jest.fn()

    guard(guardReq, guardRes, next)

    expect(next).not.toHaveBeenCalled()
    expect(guardRes.status).toHaveBeenCalledWith(403)
  })

  it("refuses a SKU already taken, comparing it normalised", async () => {
    const findOne = jest.spyOn(Product, "findOne").mockResolvedValue({ id: "product-999" } as any)
    const create = jest.spyOn(Product, "create")

    const res = mockResponse()

    await new CreateProductController().handle(mockRequest({ body: payload }), res)

    expect(findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { sku: "CAM-01-M" } }))
    expect(create).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it("skips the uniqueness query when no SKU is sent, so many products stay without one", async () => {
    const findOne = jest.spyOn(Product, "findOne")
    jest.spyOn(Product, "create").mockResolvedValue({
      get: () => ({ id: "product-321", sku: null }),
    } as any)

    const { sku, ...withoutSku } = payload

    await new CreateProductService().execute({
      name: withoutSku.name,
      sku: null,
      description: withoutSku.description,
      price: "19.90",
      stock: 0,
      image_url: null,
    })

    expect(findOne).not.toHaveBeenCalled()
  })

  it("rejects a price with three decimal places before touching the database", async () => {
    const create = jest.spyOn(Product, "create")
    const res = mockResponse()

    await new CreateProductController().handle(
      mockRequest({ body: { ...payload, price: 89.999 } }),
      res
    )

    expect(create).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.arrayContaining([expect.objectContaining({ path: "price" })]),
      })
    )
  })

  it("rejects a negative stock, since the column is unsigned", async () => {
    const create = jest.spyOn(Product, "create")
    const res = mockResponse()

    await new CreateProductController().handle(
      mockRequest({ body: { ...payload, stock: -1 } }),
      res
    )

    expect(create).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe("Public product storefront (most called route)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("lists active products without forcing an empty name match when no search is sent", async () => {
    const findAndCountAll = jest.spyOn(Product, "findAndCountAll").mockResolvedValue({ rows: [], count: 0 } as any)

    await new ListProductsController().handle(mockRequest({ query: {} }), mockResponse())

    expect(findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true } })
    )
  })

  it("searches by name or sku, escaping wildcard characters, when a search term is sent", async () => {
    const findAndCountAll = jest.spyOn(Product, "findAndCountAll").mockResolvedValue({ rows: [], count: 0 } as any)

    await new ListProductsController().handle(mockRequest({ query: { search: "cam%01" } }), mockResponse())

    expect(findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          active: true,
          [Op.or]: [
            { name: { [Op.like]: "%cam\\%01%" } },
            { sku: { [Op.like]: "%cam\\%01%" } },
          ],
        },
      })
    )
  })
})

describe("Public product detail hides inactive products", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("responds 404 for a product that isn't active, indistinguishable from one that doesn't exist", async () => {
    const findOne = jest.spyOn(Product, "findOne").mockResolvedValue(null)
    const res = mockResponse()

    await new GetProductByIdController().handle(mockRequest({ params: { id: "product-1" } }), res)

    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "product-1", active: true } })
    )
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it("returns the product when it is active", async () => {
    jest.spyOn(Product, "findOne").mockResolvedValue({
      get: () => ({ id: "product-1", name: "Camiseta", active: true }),
    } as any)

    const res = mockResponse()
    await new GetProductByIdController().handle(mockRequest({ params: { id: "product-1" } }), res)

    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe("Internal product panel filtering by active state", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("coerces the ?active= query string into a real boolean", async () => {
    const findAndCountAll = jest.spyOn(Product, "findAndCountAll").mockResolvedValue({ rows: [], count: 0 } as any)

    await new ListAllProductsController().handle(mockRequest({ query: { active: "false" } }), mockResponse())

    expect(findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ active: false }) })
    )
  })

  it("rejects an active filter that isn't literally 'true' or 'false'", async () => {
    const findAndCountAll = jest.spyOn(Product, "findAndCountAll")
    const res = mockResponse()

    await new ListAllProductsController().handle(mockRequest({ query: { active: "1" } }), res)

    expect(findAndCountAll).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe("Product update preserves fields that weren't sent", () => {
  const buildProduct = (overrides: Partial<{ id: string, price: string, active: boolean }> = {}) => ({
    id: "product-1",
    price: "10.00",
    active: false,
    update: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockReturnValue({ id: "product-1", name: "Camiseta" }),
    ...overrides,
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("only writes the field that was sent, instead of nulling out the rest", async () => {
    const product = buildProduct()
    jest.spyOn(Product, "findByPk").mockResolvedValue(product as any)

    const res = mockResponse()
    await new UpdateProductController().handle(
      mockRequest({ params: { id: "product-1" }, body: { price: 120.5 } }),
      res
    )

    expect(product.update).toHaveBeenCalledWith({ price: "120.50" })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it("rejects a SKU already used by another product, but allows keeping its own SKU", async () => {
    const product = buildProduct()
    jest.spyOn(Product, "findByPk").mockResolvedValue(product as any)
    jest.spyOn(Product, "findOne").mockResolvedValue({ id: "another-product" } as any)

    await expect(
      new UpdateProductService().execute({ id: "product-1", sku: "CAM-02" })
    ).rejects.toThrow("A product with this SKU already exists")
  })

  it("responds 404 when the product doesn't exist", async () => {
    jest.spyOn(Product, "findByPk").mockResolvedValue(null)
    const res = mockResponse()

    await new UpdateProductController().handle(
      mockRequest({ params: { id: "missing" }, body: { name: "Novo nome" } }),
      res
    )

    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe("Product activation requires a real price", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("refuses to activate a product priced at zero", async () => {
    const product = { id: "product-1", price: "0.00", active: false, update: jest.fn() }
    jest.spyOn(Product, "findByPk").mockResolvedValue(product as any)

    await expect(new ActivateProductService().execute({ id: "product-1" })).rejects.toThrow(
      "Cannot be possible to activate a product with a price of zero or lower"
    )
    expect(product.update).not.toHaveBeenCalled()
  })

  it("activates a product that has a positive price", async () => {
    const product = { id: "product-1", price: "49.90", active: false, update: jest.fn().mockResolvedValue(undefined) }
    jest.spyOn(Product, "findByPk").mockResolvedValue(product as any)

    await new ActivateProductService().execute({ id: "product-1" })

    expect(product.update).toHaveBeenCalledWith({ active: true })
  })
})

describe("Product deactivation takes it off the storefront without deleting it", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("deactivates an active product", async () => {
    const product = { id: "product-1", active: true, update: jest.fn().mockResolvedValue(undefined) }
    jest.spyOn(Product, "findByPk").mockResolvedValue(product as any)

    const res = mockResponse()
    await new DeactivateProductController().handle(mockRequest({ params: { id: "product-1" } }), res)

    expect(product.update).toHaveBeenCalledWith({ active: false })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it("refuses to deactivate a product that is already inactive", async () => {
    const product = { id: "product-1", active: false, update: jest.fn() }
    jest.spyOn(Product, "findByPk").mockResolvedValue(product as any)

    const res = mockResponse()
    await new DeactivateProductController().handle(mockRequest({ params: { id: "product-1" } }), res)

    expect(product.update).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe("Stock adjustment sets the absolute shelf count", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("overwrites stock with the counted value, not a delta", async () => {
    const product = { id: "product-1", stock: 5, update: jest.fn().mockResolvedValue(undefined), get: jest.fn().mockReturnValue({ id: "product-1", stock: 35 }) }
    jest.spyOn(Product, "findByPk").mockResolvedValue(product as any)

    const res = mockResponse()
    await new UpdateProductStockController().handle(
      mockRequest({ params: { id: "product-1" }, body: { stock: 35 } }),
      res
    )

    expect(product.update).toHaveBeenCalledWith({ stock: 35 })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it("rejects a negative stock count", async () => {
    const findByPk = jest.spyOn(Product, "findByPk")
    const res = mockResponse()

    await new UpdateProductStockController().handle(
      mockRequest({ params: { id: "product-1" }, body: { stock: -3 } }),
      res
    )

    expect(findByPk).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
  })
})
