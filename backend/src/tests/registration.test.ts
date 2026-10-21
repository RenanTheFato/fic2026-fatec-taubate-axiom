import { CheckInRegistrationController } from "../controllers/registration/check-in-registration-controller.js";
import { CreateRegistrationController } from "../controllers/registration/create-registration-controller.js";
import { GetTicketController } from "../controllers/registration/get-ticket-controller.js";
import { BadRequestError } from "../config/errors.js";
import { Event } from "../models/event-model.js";
import { Receipt } from "../models/receipt-model.js";
import { Registration } from "../models/registration-model.js";
import { Transaction } from "../models/transaction-model.js";
import { CancelRegistrationService } from "../services/registration/cancel-registration-service.js";
import { CheckInRegistrationService } from "../services/registration/check-in-registration-service.js";
import { GetTransactionStatusService } from "../services/transaction/get-transaction-status-service.js";
import { formatTicketCode, normalizeTicketCode } from "../utils/ticket-code.js";
import { mockRequest, mockResponse } from "./utils/mock-http.js";
import { mockSequelizeTransaction } from "./utils/mock-sequelize.js";

const eventId = "4a7c9e1b-2d3f-4b5a-8c6d-7e8f9a0b1c2d"
const otherEventId = "9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f"

function storedEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: eventId,
    title: "Dia de Portas Abertas",
    slug: "dia-de-portas-abertas",
    status: "published",
    ticket_price: "0.00",
    starts_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    ends_at: null,
    capacity: 80,
    taken_seats: 12,
    ...overrides,
  }
}

function storedRegistration(overrides: Record<string, unknown> = {}) {
  const attributes = {
    id: "registration-1",
    event_id: eventId,
    transaction_id: null,
    ticket_code: "7KQ2MX9D4R",
    participant_name: "Maria Oliveira",
    participant_email: "maria@exemplo.com.br",
    status: "confirmed",
    checked_in_at: null,
    ...overrides,
  }

  const registration = {
    ...attributes,
    update: jest.fn().mockImplementation(async (values: Record<string, unknown>) => Object.assign(registration, values)),
    get: jest.fn().mockImplementation(() => ({ ...attributes, ...registration, update: undefined, get: undefined })),
  }

  return registration
}

const visitor = {
  event_id: eventId,
  participant_name: "Maria Oliveira",
  participant_email: "maria@exemplo.com.br",
}

describe("Event registration (sign up for free, the door checks in)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    mockSequelizeTransaction()
  })

  it("takes one seat with a conditional update and hands back the ticket code", async () => {
    jest.spyOn(Event, "findByPk").mockResolvedValue(storedEvent() as never)
    jest.spyOn(Registration, "findOne").mockResolvedValue(null)
    const seat = jest.spyOn(Event, "update").mockResolvedValue([1] as never)
    const create = jest.spyOn(Registration, "create").mockImplementation((async (values: Record<string, unknown>) => ({
      id: "registration-1",
      ...values,
    })) as never)

    const res = mockResponse()
    await new CreateRegistrationController().handle(mockRequest({ body: visitor }), res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(seat).toHaveBeenCalledWith(
      expect.objectContaining({ taken_seats: expect.anything() }),
      expect.objectContaining({ where: expect.objectContaining({ id: eventId }) })
    )
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ transaction_id: null, participant_phone: null, status: "confirmed" }),
      expect.anything()
    )

    const { registration } = (res.json as jest.Mock).mock.calls[0][0]
    expect(registration.ticket_code).toMatch(/^[0-9A-Z]{5}-[0-9A-Z]{5}$/)
  })

  it("sends a paid event to the checkout, without touching the seats", async () => {
    jest.spyOn(Event, "findByPk").mockResolvedValue(storedEvent({ ticket_price: "120.00" }) as never)
    const seat = jest.spyOn(Event, "update")

    const res = mockResponse()
    await new CreateRegistrationController().handle(mockRequest({ body: visitor }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(seat).not.toHaveBeenCalled()
  })

  it("refuses the same name and e-mail twice for the same event", async () => {
    jest.spyOn(Event, "findByPk").mockResolvedValue(storedEvent() as never)
    jest.spyOn(Registration, "findOne").mockResolvedValue({ id: "registration-1" } as never)
    const seat = jest.spyOn(Event, "update")

    const res = mockResponse()
    await new CreateRegistrationController().handle(mockRequest({ body: visitor }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(seat).not.toHaveBeenCalled()
  })

  it("creates nothing when the last seat went to someone else", async () => {
    jest.spyOn(Event, "findByPk").mockResolvedValue(storedEvent() as never)
    jest.spyOn(Registration, "findOne").mockResolvedValue(null)
    jest.spyOn(Event, "update").mockResolvedValue([0] as never)
    const create = jest.spyOn(Registration, "create")

    const res = mockResponse()
    await new CreateRegistrationController().handle(mockRequest({ body: visitor }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(create).not.toHaveBeenCalled()
  })

  it("answers 404 for a draft event, as if it did not exist", async () => {
    jest.spyOn(Event, "findByPk").mockResolvedValue(storedEvent({ status: "draft" }) as never)

    const res = mockResponse()
    await new CreateRegistrationController().handle(mockRequest({ body: visitor }), res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it("opens the ticket by the code however it was typed, with the name but never the e-mail", async () => {
    const findOne = jest.spyOn(Registration, "findOne").mockResolvedValue({
      ...storedRegistration(),
      event: { get: () => ({ id: eventId, title: "Dia de Portas Abertas", slug: "dia-de-portas-abertas", status: "published" }) },
    } as never)

    const res = mockResponse()
    await new GetTicketController().handle(mockRequest({ params: { code: "7kq2m-x9d4r" } as never }), res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect((findOne.mock.calls[0][0] as { where: Record<string, unknown> }).where).toEqual({ ticket_code: "7KQ2MX9D4R" })

    const { ticket } = (res.json as jest.Mock).mock.calls[0][0]
    expect(ticket.ticket_code).toBe("7KQ2M-X9D4R")
    expect(ticket.participant_name).toBe("Maria Oliveira")
    expect(ticket).not.toHaveProperty("participant_email")
    expect(ticket.qr).toMatch(/^data:image\/svg\+xml;base64,/)
  })

  it("reads the code however it is typed, and forgives O for zero and L for one", () => {
    expect(normalizeTicketCode("7KQ2M-X9D4R")).toBe("7KQ2MX9D4R")
    expect(normalizeTicketCode(" 7kq2m x9d4r ")).toBe("7KQ2MX9D4R")
    expect(normalizeTicketCode("lO0AB-CDEFG")).toBe("100ABCDEFG")
    expect(formatTicketCode("7KQ2MX9D4R")).toBe("7KQ2M-X9D4R")
  })

  it("records the entry and who recorded it", async () => {
    const registration = storedRegistration()
    jest.spyOn(Registration, "findOne").mockResolvedValue(registration as never)
    jest.spyOn(Event, "findByPk").mockResolvedValue(storedEvent() as never)

    const res = mockResponse()
    await new CheckInRegistrationController().handle(mockRequest({
      user: { id: "user-communication", role: "communication" },
      params: { code: "7KQ2M-X9D4R" } as never,
      body: { event_id: eventId },
    } as never), res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(registration.update).toHaveBeenCalledWith(
      expect.objectContaining({ checked_in_at: expect.any(Date), checked_in_by: "user-communication" }),
      expect.anything()
    )
  })

  it("refuses a valid ticket of another event and a ticket that already came in", async () => {
    const elsewhere = storedRegistration({ event_id: otherEventId })
    jest.spyOn(Registration, "findOne").mockResolvedValue(elsewhere as never)

    await expect(new CheckInRegistrationService().execute({ code: "7KQ2MX9D4R", event_id: eventId, checked_in_by: null }))
      .rejects.toBeInstanceOf(BadRequestError)

    const twice = storedRegistration({ checked_in_at: new Date() })
    jest.spyOn(Registration, "findOne").mockResolvedValue(twice as never)

    await expect(new CheckInRegistrationService().execute({ code: "7KQ2MX9D4R", event_id: eventId, checked_in_by: null }))
      .rejects.toBeInstanceOf(BadRequestError)

    expect(elsewhere.update).not.toHaveBeenCalled()
    expect(twice.update).not.toHaveBeenCalled()
  })

  it("gives the seat back when a free registration is cancelled, and sends a paid one to the refund", async () => {
    const free = storedRegistration()
    jest.spyOn(Registration, "findByPk").mockResolvedValue(free as never)
    const seat = jest.spyOn(Event, "update").mockResolvedValue([1] as never)

    await new CancelRegistrationService().execute({ id: "registration-1" })

    expect(free.update).toHaveBeenCalledWith(expect.objectContaining({ status: "cancelled" }), expect.anything())
    expect(seat).toHaveBeenCalledWith(
      expect.objectContaining({ taken_seats: expect.anything() }),
      expect.objectContaining({ where: { id: eventId } })
    )

    const paid = storedRegistration({ transaction_id: "transaction-1" })
    jest.spyOn(Registration, "findByPk").mockResolvedValue(paid as never)

    await expect(new CancelRegistrationService().execute({ id: "registration-1" })).rejects.toBeInstanceOf(BadRequestError)
    expect(paid.update).not.toHaveBeenCalled()
  })

  it("shows the ticket code on the order status once a ticket is confirmed", async () => {
    jest.spyOn(Transaction, "findByPk").mockResolvedValue({
      id: "transaction-1",
      type: "ticket",
      status: "confirmed",
      amount: "120.00",
    } as never)
    jest.spyOn(Receipt, "findOne").mockResolvedValue({ hash: "a".repeat(64), number: "2026/000001" } as never)
    jest.spyOn(Registration, "findOne").mockResolvedValue({ ticket_code: "7KQ2MX9D4R" } as never)

    const status = await new GetTransactionStatusService().execute({ id: "transaction-1" })

    expect(status.ticket_code).toBe("7KQ2M-X9D4R")
  })
})
