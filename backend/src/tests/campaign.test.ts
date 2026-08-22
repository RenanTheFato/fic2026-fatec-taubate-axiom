import { CreateCampaignController } from "../controllers/campaign/create-campaign-controller.js";
import { RoleMiddleware } from "../middlewares/role-middleware.js";
import { CreateCampaignService } from "../services/campaign/create-campaign-service.js";
import { mockRequest, mockResponse } from "./utils/mock-http.js";

jest.mock("../services/campaign/create-campaign-service.js")

const MockedCreateCampaignService = CreateCampaignService as jest.MockedClass<typeof CreateCampaignService>

describe("Campaign creation guarded by role (real admin journey)", () => {
  const payload = {
    title: "Natal Solidário 2026",
    description: "Arrecadação de cestas básicas para 200 famílias.",
    goal_amount: 25000,
    starts_at: "2026-11-01T00:00:00.000Z",
    ends_at: "2026-12-25T23:59:59.000Z",
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("lets an admin through the role guard and creates the campaign as a draft", async () => {
    const guard = RoleMiddleware("admin", "communication")

    const guardReq = mockRequest({ user: { id: "user-123", role: "admin" } })
    const guardRes = mockResponse()
    const next = jest.fn()

    guard(guardReq, guardRes, next)

    expect(next).toHaveBeenCalled()
    expect(guardRes.status).not.toHaveBeenCalled()

    MockedCreateCampaignService.prototype.execute = jest.fn().mockResolvedValue({
      id: "campaign-123",
      title: payload.title,
      slug: "natal-solidario-2026",
      status: "draft",
    })

    const createReq = mockRequest({ body: payload, user: { id: "user-123", role: "admin" } })
    const createRes = mockResponse()

    await new CreateCampaignController().handle(createReq, createRes)

    expect(createRes.status).toHaveBeenCalledWith(201)
    expect(MockedCreateCampaignService.prototype.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        title: payload.title,
        goal_amount: "25000.00",
        starts_at: new Date(payload.starts_at),
      })
    )
    expect(createRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ campaign: expect.objectContaining({ status: "draft" }) })
    )
  })

  it("never reaches the controller when the authenticated user is a volunteer", async () => {
    const guard = RoleMiddleware("admin", "communication")

    const guardReq = mockRequest({ user: { id: "user-456", role: "volunteer" } })
    const guardRes = mockResponse()
    const next = jest.fn()

    guard(guardReq, guardRes, next)

    expect(next).not.toHaveBeenCalled()
    expect(guardRes.status).toHaveBeenCalledWith(403)
    expect(MockedCreateCampaignService.prototype.execute).not.toHaveBeenCalled()
  })

  it("blocks a communication user from the admin-only guard used by cancel and delete", async () => {
    const adminOnlyGuard = RoleMiddleware("admin")

    const guardReq = mockRequest({ user: { id: "user-789", role: "communication" } })
    const guardRes = mockResponse()
    const next = jest.fn()

    adminOnlyGuard(guardReq, guardRes, next)

    expect(next).not.toHaveBeenCalled()
    expect(guardRes.status).toHaveBeenCalledWith(403)
  })

  it("answers 401, not 403, when no authenticated user reached the guard", () => {
    const guard = RoleMiddleware("admin", "communication")

    const guardRes = mockResponse()
    const next = jest.fn()

    guard(mockRequest(), guardRes, next)

    expect(next).not.toHaveBeenCalled()
    expect(guardRes.status).toHaveBeenCalledWith(401)
  })
})
