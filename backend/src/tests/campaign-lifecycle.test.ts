import { BadRequestError, NotFoundError } from "../config/errors.js";
import { Campaign } from "../models/campaign-model.js";
import { CancelCampaignService } from "../services/campaign/cancel-campaign-service.js";
import { DeleteCampaignService } from "../services/campaign/delete-campaign-service.js";
import { FinishCampaignService } from "../services/campaign/finish-campaign-service.js";
import { PublishCampaignService } from "../services/campaign/publish-campaign-service.js";
import { UpdateCampaignService } from "../services/campaign/update-campaign-service.js";

const campaignId = "campaign-123"

function foundCampaign(overrides: Record<string, unknown> = {}) {
  return jest.spyOn(Campaign, "findOne").mockResolvedValue({
    id: campaignId,
    status: "draft",
    goal_amount: "25000.00",
    starts_at: new Date("2026-11-01T00:00:00.000Z"),
    ends_at: null,
    ...overrides,
  } as any)
}

describe("Campaign status lifecycle (draft to active to finished)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    jest.spyOn(Campaign, "update").mockResolvedValue([1] as any)
    jest.spyOn(Campaign, "destroy").mockResolvedValue(1 as any)
  })

  it("walks a draft campaign through publish and finish", async () => {
    foundCampaign({ status: "draft" })
    await new PublishCampaignService().execute({ campaign_id: campaignId })

    expect(Campaign.update).toHaveBeenCalledWith(
      { status: "active" },
      expect.objectContaining({ where: { id: campaignId } })
    )

    foundCampaign({ status: "active" })
    await new FinishCampaignService().execute({ campaign_id: campaignId })

    expect(Campaign.update).toHaveBeenLastCalledWith(
      { status: "finished" },
      expect.objectContaining({ where: { id: campaignId } })
    )
  })

  it("refuses to publish a campaign that is already active", async () => {
    foundCampaign({ status: "active" })

    await expect(new PublishCampaignService().execute({ campaign_id: campaignId }))
      .rejects.toBeInstanceOf(BadRequestError)
    expect(Campaign.update).not.toHaveBeenCalled()
  })

  it("refuses to publish a campaign whose goal is zero", async () => {
    foundCampaign({ status: "draft", goal_amount: "0.00" })

    await expect(new PublishCampaignService().execute({ campaign_id: campaignId }))
      .rejects.toBeInstanceOf(BadRequestError)
    expect(Campaign.update).not.toHaveBeenCalled()
  })

  it("refuses to finish a campaign that was never published", async () => {
    foundCampaign({ status: "draft" })

    await expect(new FinishCampaignService().execute({ campaign_id: campaignId }))
      .rejects.toBeInstanceOf(BadRequestError)
    expect(Campaign.update).not.toHaveBeenCalled()
  })

  it("cancels a draft or an active campaign, but never a finished one", async () => {
    foundCampaign({ status: "active" })
    await new CancelCampaignService().execute({ campaign_id: campaignId })

    expect(Campaign.update).toHaveBeenCalledWith(
      { status: "cancelled" },
      expect.objectContaining({ where: { id: campaignId } })
    )

    foundCampaign({ status: "finished" })

    await expect(new CancelCampaignService().execute({ campaign_id: campaignId }))
      .rejects.toBeInstanceOf(BadRequestError)
  })

  it("deletes only a draft, so no campaign that ever received money disappears", async () => {
    foundCampaign({ status: "draft" })
    await new DeleteCampaignService().execute({ campaign_id: campaignId })

    expect(Campaign.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: campaignId } })
    )

    foundCampaign({ status: "active" })

    await expect(new DeleteCampaignService().execute({ campaign_id: campaignId }))
      .rejects.toBeInstanceOf(BadRequestError)
    expect(Campaign.destroy).toHaveBeenCalledTimes(1)
  })

  it("answers not found instead of touching anything when the campaign doesn't exist", async () => {
    jest.spyOn(Campaign, "findOne").mockResolvedValue(null)

    await expect(new PublishCampaignService().execute({ campaign_id: "ghost" }))
      .rejects.toBeInstanceOf(NotFoundError)
    expect(Campaign.update).not.toHaveBeenCalled()
  })
})

describe("Campaign update keeps the immutable fields immutable", () => {
  function editableCampaign(overrides: Record<string, unknown> = {}) {
    const instance = {
      id: campaignId,
      status: "draft",
      slug: "natal-solidario-2026",
      starts_at: new Date("2026-11-01T00:00:00.000Z"),
      ends_at: null,
      update: jest.fn(),
      get: jest.fn().mockReturnValue({ id: campaignId, slug: "natal-solidario-2026" }),
      ...overrides,
    }
    jest.spyOn(Campaign, "findOne").mockResolvedValue(instance as any)
    return instance
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("changes the title without ever regenerating the slug", async () => {
    const instance = editableCampaign()

    await new UpdateCampaignService().execute({ campaign_id: campaignId, title: "Natal Solidário 2027" })

    expect(instance.update).toHaveBeenCalledWith({ title: "Natal Solidário 2027" })
    expect(instance.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ slug: expect.anything() })
    )
    expect(instance.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: expect.anything() })
    )
  })

  it("refuses an end date that lands before the start date already stored", async () => {
    const instance = editableCampaign()

    await expect(new UpdateCampaignService().execute({
      campaign_id: campaignId,
      ends_at: new Date("2026-10-01T00:00:00.000Z"),
    })).rejects.toBeInstanceOf(BadRequestError)
    expect(instance.update).not.toHaveBeenCalled()
  })

  it("refuses to edit a campaign that is already finished", async () => {
    const instance = editableCampaign({ status: "finished" })

    await expect(new UpdateCampaignService().execute({ campaign_id: campaignId, title: "Outro título" }))
      .rejects.toBeInstanceOf(BadRequestError)
    expect(instance.update).not.toHaveBeenCalled()
  })
})
