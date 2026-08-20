import { Op } from "sequelize";
import { NotFoundError } from "../config/errors.js";
import { GetCampaignBySlugController } from "../controllers/campaign/get-campaign-by-slug-controller.js";
import { ListCampaignsController } from "../controllers/campaign/list-campaigns-controller.js";
import { Campaign } from "../models/campaign-model.js";
import { GetCampaignBySlugService } from "../services/campaign/get-campaign-by-slug-service.js";
import { ListCampaignsService } from "../services/campaign/list-campaigns-service.js";
import { mockRequest, mockResponse } from "./utils/mock-http.js";

jest.mock("../services/campaign/list-campaigns-service.js")

const MockedListCampaignsService = ListCampaignsService as jest.MockedClass<typeof ListCampaignsService>

describe("Public campaign access never leaks a draft", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("queries only active and finished campaigns and returns the goal percentage", async () => {
    const findOne = jest.spyOn(Campaign, "findOne").mockResolvedValue({
      id: "campaign-123",
      slug: "natal-solidario-2026",
      goal_amount: "1000.00",
      raised_amount: "250.00",
      status: "active",
    } as any)

    const campaign = await new GetCampaignBySlugService().execute({ slug: "natal-solidario-2026" })

    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          slug: "natal-solidario-2026",
          status: { [Op.in]: ["active", "finished"] },
        }),
      })
    )
    expect(campaign.percentual_completed).toBe(25)
  })

  it("answers 404 for a slug that exists but is still a draft", async () => {
    jest.spyOn(GetCampaignBySlugService.prototype, "execute")
      .mockRejectedValue(new NotFoundError("Campaign Not Found"))

    const req = mockRequest({ params: { slug: "campanha-em-rascunho" } as any })
    const res = mockResponse()

    await new GetCampaignBySlugController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.status).not.toHaveBeenCalledWith(403)
  })
})

describe("Public campaign listing pagination", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    MockedListCampaignsService.prototype.execute = jest.fn().mockResolvedValue({ campaigns: [], total: 0 })
  })

  it("coerces the query string into numbers, since express always hands them over as text", async () => {
    const req = mockRequest({ query: { page: "2", limit: "10" } as any })
    const res = mockResponse()

    await new ListCampaignsController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(MockedListCampaignsService.prototype.execute).toHaveBeenCalledWith({ page: 2, limit: 10 })
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ campaigns: [], total: 0 })
    )
  })

  it("falls back to the defaults when no query string is sent", async () => {
    const req = mockRequest({ query: {} as any })
    const res = mockResponse()

    await new ListCampaignsController().handle(req, res)

    expect(MockedListCampaignsService.prototype.execute).toHaveBeenCalledWith({ page: 1, limit: 50 })
  })

  it("refuses a limit above the cap instead of letting the whole table be scraped", async () => {
    const req = mockRequest({ query: { limit: "5000" } as any })
    const res = mockResponse()

    await new ListCampaignsController().handle(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(MockedListCampaignsService.prototype.execute).not.toHaveBeenCalled()
  })
})
