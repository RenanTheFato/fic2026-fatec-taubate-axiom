import { Op } from "sequelize";
import { CreateContactMessageController } from "../controllers/contact/create-contact-message-controller.js";
import { ListContactMessagesController } from "../controllers/contact/list-contact-messages-controller.js";
import { RequestWallRemovalController } from "../controllers/contact/request-wall-removal-controller.js";
import { ResolveContactMessageController } from "../controllers/contact/resolve-contact-message-controller.js";
import { WithdrawFromWallController } from "../controllers/contact/withdraw-from-wall-controller.js";
import { ContactMessage } from "../models/contact-message-model.js";
import { Donor } from "../models/donor-model.js";
import { Transaction } from "../models/transaction-model.js";
import { mockRequest, mockResponse } from "./utils/mock-http.js";
import { mockSequelizeTransaction } from "./utils/mock-sequelize.js";

const messageId = "5b2d1c7e-3a4f-4e8b-9c10-1a2b3c4d5e6f"

function storedMessage(overrides: Record<string, unknown> = {}) {
  const attributes = {
    id: messageId,
    channel: "wall_removal",
    subject: null,
    name: "Maria Oliveira",
    email: "maria@exemplo.com.br",
    status: "open",
    ...overrides,
  }

  const message = {
    ...attributes,
    update: jest.fn().mockImplementation(async (values: Record<string, unknown>) => Object.assign(message, values)),
    get: jest.fn().mockImplementation(() => ({ ...attributes })),
  }

  return message
}

describe("Contact inbox (the site sends, the panel answers)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("stores a message from the contact form as open, for the team to answer", async () => {
    const create = jest.spyOn(ContactMessage, "create").mockImplementation((async (values: Record<string, unknown>) => ({
      id: messageId,
      created_at: new Date(),
      ...values,
    })) as never)

    const res = mockResponse()

    await new CreateContactMessageController().handle(mockRequest({
      body: {
        channel: "contact",
        subject: "doacao",
        name: "Joana Ribeiro",
        email: "joana@exemplo.com.br",
        message: "Posso doar em nome da empresa e receber o recibo com o CNPJ?",
      },
    }), res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ channel: "contact", subject: "doacao", phone: null, status: "open" }))
  })

  it("refuses a subject that belongs to another form", async () => {
    const create = jest.spyOn(ContactMessage, "create")
    const res = mockResponse()

    await new CreateContactMessageController().handle(mockRequest({
      body: {
        channel: "ombudsman",
        subject: "doacao",
        name: "Joana Ribeiro",
        email: "joana@exemplo.com.br",
        message: "Uma mensagem com tamanho suficiente para passar.",
      },
    }), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(create).not.toHaveBeenCalled()
  })

  it("takes a wall removal request without telling whether the e-mail belongs to a donor", async () => {
    const lookup = jest.spyOn(Donor, "findAll")
    const create = jest.spyOn(ContactMessage, "create").mockImplementation((async (values: Record<string, unknown>) => ({
      id: messageId,
      created_at: new Date(),
      ...values,
    })) as never)

    const res = mockResponse()

    await new RequestWallRemovalController().handle(mockRequest({
      body: { name: "Maria Oliveira", email: "maria@exemplo.com.br", message: "" },
    }), res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ channel: "wall_removal", message: null }))
    expect(lookup).not.toHaveBeenCalled()
  })

  it("keeps the ombudsman and the job applications out of the communication inbox", async () => {
    const findAndCountAll = jest.spyOn(ContactMessage, "findAndCountAll").mockResolvedValue({
      rows: [{ get: () => ({ id: messageId, channel: "wall_removal", email: "Maria@Exemplo.com.br" }) }],
      count: 1,
    } as never)
    jest.spyOn(ContactMessage, "count").mockResolvedValue(1)
    jest.spyOn(Donor, "findAll").mockResolvedValue([{ id: "donor-1", email: "maria@exemplo.com.br" }] as never)
    jest.spyOn(Transaction, "findAll").mockResolvedValue([{ donor_id: "donor-1" }] as never)

    const res = mockResponse()

    await new ListContactMessagesController().handle(mockRequest({
      user: { id: "user-communication", role: "communication" },
      query: {},
    } as never), res)

    const where = (findAndCountAll.mock.calls[0][0] as unknown as { where: { channel: Record<symbol, string[]> } }).where
    const channels = where.channel[Op.in]
    expect(channels).toEqual(["contact", "wall_removal"])

    const { contacts } = (res.json as jest.Mock).mock.calls[0][0]
    expect(contacts[0].wall_status).toBe("listed")
  })

  it("answers 404 when communication tries to resolve an ombudsman message", async () => {
    const message = storedMessage({ channel: "ombudsman" })
    jest.spyOn(ContactMessage, "findByPk").mockResolvedValue(message as never)

    const res = mockResponse()

    await new ResolveContactMessageController().handle(mockRequest({
      user: { id: "user-communication", role: "communication" },
      params: { id: messageId } as never,
    } as never), res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(message.update).not.toHaveBeenCalled()
  })

  it("withdraws the name from every contribution of the e-mail and resolves the request together", async () => {
    mockSequelizeTransaction()
    const message = storedMessage()
    jest.spyOn(ContactMessage, "findByPk").mockResolvedValue(message as never)
    jest.spyOn(Donor, "findAll").mockResolvedValue([{ id: "donor-1" }, { id: "donor-2" }] as never)
    const update = jest.spyOn(Transaction, "update").mockResolvedValue([3] as never)

    const res = mockResponse()

    await new WithdrawFromWallController().handle(mockRequest({
      user: { id: "user-communication", role: "communication" },
      params: { id: messageId } as never,
    } as never), res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(update.mock.calls[0][0]).toEqual({ public_recognition: false })
    expect(message.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "resolved", resolved_by: "user-communication" }),
      expect.anything(),
    )
    expect((res.json as jest.Mock).mock.calls[0][0].withdrawn).toBe(3)
  })

  it("changes nothing when no donor uses the e-mail of the request", async () => {
    mockSequelizeTransaction()
    const message = storedMessage()
    jest.spyOn(ContactMessage, "findByPk").mockResolvedValue(message as never)
    jest.spyOn(Donor, "findAll").mockResolvedValue([] as never)
    const update = jest.spyOn(Transaction, "update")

    const res = mockResponse()

    await new WithdrawFromWallController().handle(mockRequest({
      user: { id: "user-admin", role: "admin" },
      params: { id: messageId } as never,
    } as never), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(update).not.toHaveBeenCalled()
    expect(message.update).not.toHaveBeenCalled()
  })
})
