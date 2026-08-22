import { CreateEventController } from "../controllers/event/create-event-controller.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { Campaign } from "../models/campaign-model.js";
import { Event } from "../models/event-model.js";
import { mockRequest, mockResponse } from "./utils/mock-http.js";

describe("Event creation guarded by role (real communication journey)", () => {
  const payload = {
    campaign_id: "9f1d4c2e-6b7a-4d3f-8c21-0a5e7b9d1c34",
    title: "Jantar Beneficente Somos do Bem",
    description: "Jantar com renda revertida para a campanha de inverno.",
    location: "Salão Paroquial, Rua das Flores 120, Sorocaba",
    starts_at: "2026-09-12T20:00:00.000Z",
    ends_at: "2026-09-12T23:30:00.000Z",
    ticket_price: 120,
    capacity: 150,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("lets a communication user through the guard and creates the event as a draft", async () => {
    const guard = RoleMiddleware("admin", "communication")

    const guardReq = mockRequest({ user: { id: "user-123", role: "communication" } })
    const guardRes = mockResponse()
    const next = jest.fn()

    guard(guardReq, guardRes, next)

    expect(next).toHaveBeenCalled()
    expect(guardRes.status).not.toHaveBeenCalled()

    jest.spyOn(Event, "findOne").mockResolvedValue(null)
    jest.spyOn(Campaign, "findByPk").mockResolvedValue({ id: payload.campaign_id, status: "active" } as any)
    const create = jest.spyOn(Event, "create").mockResolvedValue({
      get: () => ({ id: "event-123", title: payload.title, slug: "jantar-beneficente-somos-do-bem", status: "draft", taken_seats: 0 }),
    } as any)

    const createReq = mockRequest({ body: payload, user: { id: "user-123", role: "communication" } })
    const createRes = mockResponse()

    await new CreateEventController().handle(createReq, createRes)

    expect(createRes.status).toHaveBeenCalledWith(201)
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "jantar-beneficente-somos-do-bem", ticket_price: "120.00", status: "draft", taken_seats: 0 })
    )
    expect(createRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ event: expect.objectContaining({ status: "draft" }) })
    )
  })

  it("refuses to attach the event to a cancelled campaign", async () => {
    jest.spyOn(Event, "findOne").mockResolvedValue(null)
    jest.spyOn(Campaign, "findByPk").mockResolvedValue({ id: payload.campaign_id, status: "cancelled" } as any)
    const create = jest.spyOn(Event, "create")

    const req = mockRequest({ body: payload, user: { id: "user-123", role: "communication" } })
    const res = mockResponse()

    await new CreateEventController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(create).not.toHaveBeenCalled()
  })

  it("never reaches the controller when the authenticated user is a volunteer", async () => {
    const guard = RoleMiddleware("admin", "communication")

    const guardReq = mockRequest({ user: { id: "user-456", role: "volunteer" } })
    const guardRes = mockResponse()
    const next = jest.fn()

    guard(guardReq, guardRes, next)

    expect(next).not.toHaveBeenCalled()
    expect(guardRes.status).toHaveBeenCalledWith(403)
  })
})
