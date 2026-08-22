import { BadRequestError, NotFoundError } from "../config/errors.js";
import { Campaign } from "../models/campaign-model.js";
import { Event } from "../models/event-model.js";
import { CancelEventService } from "../services/event/cancel-event-service.js";
import { DeleteEventService } from "../services/event/delete-event-service.js";
import { FinishEventService } from "../services/event/finish-event-service.js";
import { PublishEventService } from "../services/event/publish-event-service.js";
import { UpdateEventCapacityService } from "../services/event/update-event-capacity-service.js";
import { UpdateEventService } from "../services/event/update-event-service.js";

const eventId = "event-123"

function foundEvent(overrides: Record<string, unknown> = {}) {
  return jest.spyOn(Event, "findOne").mockResolvedValue({
    id: eventId,
    status: "draft",
    starts_at: new Date("2026-11-01T00:00:00.000Z"),
    ends_at: null,
    ...overrides,
  } as any)
}

describe("Event status lifecycle (draft to published to finished)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    jest.spyOn(Event, "update").mockResolvedValue([1] as any)
    jest.spyOn(Event, "destroy").mockResolvedValue(1 as any)
  })

  it("walks a draft event through publish and finish", async () => {
    foundEvent({ status: "draft", starts_at: new Date("2099-01-01T00:00:00.000Z") })
    await new PublishEventService().execute({ event_id: eventId })

    expect(Event.update).toHaveBeenCalledWith(
      { status: "published" },
      expect.objectContaining({ where: { id: eventId } })
    )

    foundEvent({ status: "published" })
    await new FinishEventService().execute({ event_id: eventId })

    expect(Event.update).toHaveBeenLastCalledWith(
      { status: "finished" },
      expect.objectContaining({ where: { id: eventId } })
    )
  })

  it("refuses to publish an event that is already published", async () => {
    foundEvent({ status: "published" })

    await expect(new PublishEventService().execute({ event_id: eventId }))
      .rejects.toBeInstanceOf(BadRequestError)
    expect(Event.update).not.toHaveBeenCalled()
  })

  it("refuses to publish an event whose start date already passed", async () => {
    foundEvent({ status: "draft", starts_at: new Date("2020-01-01T00:00:00.000Z") })

    await expect(new PublishEventService().execute({ event_id: eventId }))
      .rejects.toBeInstanceOf(BadRequestError)
    expect(Event.update).not.toHaveBeenCalled()
  })

  it("refuses to finish an event that was never published", async () => {
    foundEvent({ status: "draft" })

    await expect(new FinishEventService().execute({ event_id: eventId }))
      .rejects.toBeInstanceOf(BadRequestError)
    expect(Event.update).not.toHaveBeenCalled()
  })

  it("cancels a draft or a published event, but never a finished one", async () => {
    foundEvent({ status: "published" })
    await new CancelEventService().execute({ event_id: eventId })

    expect(Event.update).toHaveBeenCalledWith(
      { status: "cancelled" },
      expect.objectContaining({ where: { id: eventId } })
    )

    foundEvent({ status: "finished" })

    await expect(new CancelEventService().execute({ event_id: eventId }))
      .rejects.toBeInstanceOf(BadRequestError)
  })

  it("deletes only a draft, so no event that was ever published disappears", async () => {
    foundEvent({ status: "draft" })
    await new DeleteEventService().execute({ event_id: eventId })

    expect(Event.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: eventId } })
    )

    foundEvent({ status: "published" })

    await expect(new DeleteEventService().execute({ event_id: eventId }))
      .rejects.toBeInstanceOf(BadRequestError)
    expect(Event.destroy).toHaveBeenCalledTimes(1)
  })

  it("answers not found instead of touching anything when the event doesn't exist", async () => {
    jest.spyOn(Event, "findOne").mockResolvedValue(null)

    await expect(new PublishEventService().execute({ event_id: "ghost" }))
      .rejects.toBeInstanceOf(NotFoundError)
    expect(Event.update).not.toHaveBeenCalled()
  })
})

describe("Event update keeps the immutable fields immutable", () => {
  function editableEvent(overrides: Record<string, unknown> = {}) {
    const instance = {
      id: eventId,
      status: "draft",
      slug: "jantar-beneficente-somos-do-bem",
      starts_at: new Date("2026-11-01T00:00:00.000Z"),
      ends_at: null,
      update: jest.fn(),
      get: jest.fn().mockReturnValue({ id: eventId, slug: "jantar-beneficente-somos-do-bem" }),
      ...overrides,
    }
    jest.spyOn(Event, "findOne").mockResolvedValue(instance as any)
    return instance
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("changes the title without ever regenerating the slug", async () => {
    const instance = editableEvent()

    await new UpdateEventService().execute({ event_id: eventId, title: "Jantar Beneficente 2027" })

    expect(instance.update).toHaveBeenCalledWith({ title: "Jantar Beneficente 2027" })
    expect(instance.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ slug: expect.anything() })
    )
    expect(instance.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: expect.anything() })
    )
  })

  it("refuses an end date that lands before the start date already stored", async () => {
    const instance = editableEvent()

    await expect(new UpdateEventService().execute({
      event_id: eventId,
      ends_at: new Date("2026-10-01T00:00:00.000Z"),
    })).rejects.toBeInstanceOf(BadRequestError)
    expect(instance.update).not.toHaveBeenCalled()
  })

  it("refuses to edit an event that is already finished", async () => {
    const instance = editableEvent({ status: "finished" })

    await expect(new UpdateEventService().execute({ event_id: eventId, title: "Outro título" }))
      .rejects.toBeInstanceOf(BadRequestError)
    expect(instance.update).not.toHaveBeenCalled()
  })

  it("refuses to attach the event to a cancelled campaign", async () => {
    const instance = editableEvent()
    jest.spyOn(Campaign, "findByPk").mockResolvedValue({ id: "campaign-1", status: "cancelled" } as any)

    await expect(new UpdateEventService().execute({ event_id: eventId, campaign_id: "campaign-1" }))
      .rejects.toBeInstanceOf(BadRequestError)
    expect(instance.update).not.toHaveBeenCalled()
  })
})

describe("Event capacity adjustment never drops below seats already taken", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  function seatedEvent(taken_seats: number) {
    const instance = {
      id: eventId,
      taken_seats,
      update: jest.fn(),
      get: jest.fn().mockReturnValue({ id: eventId, taken_seats, capacity: null }),
    }
    jest.spyOn(Event, "findByPk").mockResolvedValue(instance as any)
    return instance
  }

  it("accepts a capacity at or above the seats already taken", async () => {
    const instance = seatedEvent(40)

    await new UpdateEventCapacityService().execute({ event_id: eventId, capacity: 50 })

    expect(instance.update).toHaveBeenCalledWith({ capacity: 50 })
  })

  it("refuses a capacity lower than the seats already taken", async () => {
    const instance = seatedEvent(40)

    await expect(new UpdateEventCapacityService().execute({ event_id: eventId, capacity: 30 }))
      .rejects.toBeInstanceOf(BadRequestError)
    expect(instance.update).not.toHaveBeenCalled()
  })

  it("lifts the limit entirely when capacity is set to null", async () => {
    const instance = seatedEvent(40)

    await new UpdateEventCapacityService().execute({ event_id: eventId, capacity: null })

    expect(instance.update).toHaveBeenCalledWith({ capacity: null })
  })

  it("answers not found when the event doesn't exist", async () => {
    jest.spyOn(Event, "findByPk").mockResolvedValue(null)

    await expect(new UpdateEventCapacityService().execute({ event_id: "ghost", capacity: 10 }))
      .rejects.toBeInstanceOf(NotFoundError)
  })
})
