import { BadRequestError } from "../config/errors.js";
import { CreateDonorController } from "../controllers/donor/create-donor-controller.js";
import { Donor } from "../models/donor-model.js";
import { CreateDonorService } from "../services/donor/create-donor-service.js";
import { mockRequest, mockResponse } from "./utils/mock-http.js";

describe("Donor registration derives the document type and never duplicates a donor", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("strips the formatting of a CPF and stores it as cpf", async () => {
    jest.spyOn(Donor, "findOne").mockResolvedValue(null)
    const create = jest.spyOn(Donor, "create").mockResolvedValue({
      get: () => ({ id: "donor-123", document: "12345678909", document_type: "cpf" }),
    } as any)

    const { created } = await new CreateDonorService().execute({
      name: "Maria Aparecida Souza",
      email: "maria@email.com",
      document: "123.456.789-09",
      phone: null,
    })

    expect(created).toBe(true)
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ document: "12345678909", document_type: "cpf" })
    )
  })

  it("recognises a CNPJ by its length", async () => {
    jest.spyOn(Donor, "findOne").mockResolvedValue(null)
    const create = jest.spyOn(Donor, "create").mockResolvedValue({
      get: () => ({ id: "donor-456" }),
    } as any)

    await new CreateDonorService().execute({
      name: "Empresa Parceira LTDA",
      email: "contato@empresa.com",
      document: "12.345.678/0001-95",
      phone: null,
    })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ document: "12345678000195", document_type: "cnpj" })
    )
  })

  it("returns the existing donor instead of creating a second row for the same document", async () => {
    jest.spyOn(Donor, "findOne").mockResolvedValue({
      get: () => ({ id: "donor-123", document: "12345678909" }),
    } as any)
    const create = jest.spyOn(Donor, "create")

    const { donor, created } = await new CreateDonorService().execute({
      name: "Maria A. Souza",
      email: "outro@email.com",
      document: "12345678909",
      phone: null,
    })

    expect(created).toBe(false)
    expect(donor).toEqual(expect.objectContaining({ id: "donor-123" }))
    expect(create).not.toHaveBeenCalled()
  })

  it("rejects a document that is neither a CPF nor a CNPJ", async () => {
    const create = jest.spyOn(Donor, "create")

    await expect(new CreateDonorService().execute({
      name: "Fulano",
      email: "fulano@email.com",
      document: "123456",
      phone: null,
    })).rejects.toBeInstanceOf(BadRequestError)
    expect(create).not.toHaveBeenCalled()
  })

  it("answers 201 for a new donor and 200 when the donor already existed", async () => {
    jest.spyOn(CreateDonorService.prototype, "execute")
      .mockResolvedValueOnce({ donor: { id: "donor-123" } as any, created: true })
      .mockResolvedValueOnce({ donor: { id: "donor-123" } as any, created: false })

    const body = { name: "Maria Aparecida Souza", email: "maria@email.com", document: "123.456.789-09" }

    const firstRes = mockResponse()
    await new CreateDonorController().handle(mockRequest({ body }), firstRes)
    expect(firstRes.status).toHaveBeenCalledWith(201)

    const secondRes = mockResponse()
    await new CreateDonorController().handle(mockRequest({ body }), secondRes)
    expect(secondRes.status).toHaveBeenCalledWith(200)
  })
})
