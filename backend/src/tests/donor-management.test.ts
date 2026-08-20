import { Op } from "sequelize";
import { BadRequestError, NotFoundError } from "../config/errors.js";
import { Donor } from "../models/donor-model.js";
import { donorRoutes } from "../routes/donor-routes.js";
import { AnonymizeDonorService } from "../services/donor/anonymize-donor-service.js";
import { ListDonorsService } from "../services/donor/list-donors-service.js";
import { UpdateDonorService } from "../services/donor/update-donor-service.js";

const donorId = "donor-123"

function storedDonor(overrides: Record<string, unknown> = {}) {
  const instance = {
    id: donorId,
    name: "Maria Aparecida Souza",
    email: "maria@email.com",
    document: "12345678909",
    document_type: "cpf",
    phone: "+55 15 99999-0000",
    user_id: "user-123",
    anonymized_at: null,
    update: jest.fn(),
    get: jest.fn().mockReturnValue({ id: donorId }),
    ...overrides,
  }
  jest.spyOn(Donor, "findByPk").mockResolvedValue(instance as any)
  return instance
}

describe("Donor route order", () => {
  it("declares /profile before /:id, otherwise the param swallows the literal path", () => {
    const paths = donorRoutes.stack
      .map((layer: any) => layer.route?.path)
      .filter((path: string | undefined): path is string => Boolean(path))

    expect(paths).toContain("/profile")
    expect(paths).toContain("/:id")
    expect(paths.indexOf("/profile")).toBeLessThan(paths.indexOf("/:id"))
  })
})

describe("Donor update never rewrites identity", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("changes only the contact fields that were sent", async () => {
    const instance = storedDonor()

    await new UpdateDonorService().execute({ id: donorId, name: "Maria A. Souza" })

    expect(instance.update).toHaveBeenCalledWith({ name: "Maria A. Souza" })
    expect(instance.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ document: expect.anything() })
    )
    expect(instance.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ user_id: expect.anything() })
    )
  })

  it("refuses to repopulate a donor that was already anonymized", async () => {
    const instance = storedDonor({ anonymized_at: new Date("2027-03-12T10:00:00.000Z") })

    await expect(new UpdateDonorService().execute({ id: donorId, name: "Maria" }))
      .rejects.toBeInstanceOf(BadRequestError)
    expect(instance.update).not.toHaveBeenCalled()
  })

  it("answers not found for a donor that doesn't exist", async () => {
    jest.spyOn(Donor, "findByPk").mockResolvedValue(null)

    await expect(new UpdateDonorService().execute({ id: "ghost", name: "Maria" }))
      .rejects.toBeInstanceOf(NotFoundError)
  })
})

describe("Donor anonymization clears the person but keeps the row", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("wipes every personal field, unlinks the account and stamps the date", async () => {
    const instance = storedDonor()

    await new AnonymizeDonorService().execute({ id: donorId })

    const written = instance.update.mock.calls[0][0]

    expect(written).toEqual(expect.objectContaining({
      name: "Anonymized Donor",
      email: `anonymized-${donorId}@removido.invalid`,
      document: null,
      document_type: null,
      phone: null,
      user_id: null,
    }))
    expect(written.anonymized_at).toBeInstanceOf(Date)
  })

  it("refuses a second anonymization instead of restamping the date", async () => {
    const instance = storedDonor({ anonymized_at: new Date("2027-03-12T10:00:00.000Z") })

    await expect(new AnonymizeDonorService().execute({ id: donorId }))
      .rejects.toBeInstanceOf(BadRequestError)
    expect(instance.update).not.toHaveBeenCalled()
  })
})

describe("Donor search", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    jest.spyOn(Donor, "findAndCountAll").mockResolvedValue({ rows: [], count: 0 } as any)
  })

  it("matches the document by digits only, since that is how it is stored", async () => {
    await new ListDonorsService().execute({ page: 1, limit: 20, search: "123.456.789-09" })

    const options = (Donor.findAndCountAll as jest.Mock).mock.calls[0][0]

    expect(options.where[Op.or]).toEqual([
      { name: { [Op.like]: "%123.456.789-09%" } },
      { email: { [Op.like]: "%123.456.789-09%" } },
      { document: { [Op.like]: "%12345678909%" } },
    ])
  })

  it("escapes the LIKE wildcards so a search for % doesn't scan the whole table", async () => {
    await new ListDonorsService().execute({ page: 1, limit: 20, search: "100%" })

    const options = (Donor.findAndCountAll as jest.Mock).mock.calls[0][0]

    expect(options.where[Op.or][0]).toEqual({ name: { [Op.like]: "%100\\%%" } })
  })

  it("sends no where clause at all when nothing was searched", async () => {
    await new ListDonorsService().execute({ page: 1, limit: 20 })

    const options = (Donor.findAndCountAll as jest.Mock).mock.calls[0][0]

    expect(options.where).toBeUndefined()
  })
})
