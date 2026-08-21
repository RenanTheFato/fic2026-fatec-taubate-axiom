import { CreateProductController } from "../controllers/product/create-product-controller.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { Product } from "../models/product-model.js";
import { CreateProductService } from "../services/product/create-product-service.js";
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
