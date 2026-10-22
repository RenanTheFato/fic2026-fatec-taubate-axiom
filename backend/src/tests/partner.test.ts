import { ApplyPartnerController } from "../controllers/partner/apply-partner-controller.js";
import { ReviewPartnerController } from "../controllers/partner/review-partner-controller.js";
import { CreatePartnerProposalController } from "../controllers/partner-proposal/create-partner-proposal-controller.js";
import { PayPartnerProposalController } from "../controllers/partner-proposal/pay-partner-proposal-controller.js";
import { ReviewPartnerProposalController } from "../controllers/partner-proposal/review-partner-proposal-controller.js";
import { Partner } from "../models/partner-model.js";
import { PartnerProposal } from "../models/partner-proposal-model.js";
import { Transaction } from "../models/transaction-model.js";
import { User } from "../models/user-model.js";
import { ListPartnersService } from "../services/partner/list-partners-service.js";
import { CreateTransactionService } from "../services/transaction/create-transaction-service.js";
import { isValidCnpj } from "../utils/cnpj.js";
import { mockRequest, mockResponse } from "./utils/mock-http.js";
import { mockSequelizeTransaction } from "./utils/mock-sequelize.js";

const partnerId = "1f0e2d3c-4b5a-4968-8776-655443322110"
const proposalId = "2a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"
const campaignId = "3b2c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e"

function application(overrides: Record<string, unknown> = {}) {
  return {
    company_name: "Horizonte Embalagens Ltda",
    document: "45.781.296/0001-63",
    phone: "19 3875-1200",
    interests: ["sponsorship", "contribution"],
    message: "Queremos apoiar a associação com aportes nas campanhas e patrocínio de eventos.",
    public_listing: true,
    name: "Carla Mendes",
    email: "parceiro@exemplo.com.br",
    password: "Parceria@2026",
    ...overrides,
  }
}

function stored<T extends Record<string, unknown>>(attributes: T) {
  const row = {
    ...attributes,
    update: jest.fn().mockImplementation(async (values: Record<string, unknown>) => Object.assign(row, values)),
    get: jest.fn().mockImplementation(() => ({ ...row })),
  }

  return row
}

function body(res: ReturnType<typeof mockResponse>) {
  return (res.json as jest.Mock).mock.calls[0][0]
}

describe("Partner network (request, review, proposals and payment)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    mockSequelizeTransaction()
  })

  it("checks the CNPJ digits, so a typo never reaches the receipt of the company", () => {
    expect(isValidCnpj("45.781.296/0001-63")).toBe(true)
    expect(isValidCnpj("45.781.296/0001-64")).toBe(false)
    expect(isValidCnpj("11111111111111")).toBe(false)
  })

  it("creates the company account and the request under review together, from the site", async () => {
    jest.spyOn(User, "findOne").mockResolvedValue(null)
    jest.spyOn(Partner, "findOne").mockResolvedValue(null)
    const createUser = jest.spyOn(User, "create").mockResolvedValue({ id: "user-partner" } as never)
    const createPartner = jest.spyOn(Partner, "create").mockImplementation((async (values: Record<string, unknown>) => ({
      id: partnerId,
      created_at: new Date(),
      ...values,
    })) as never)

    const res = mockResponse()
    await new ApplyPartnerController().handle(mockRequest({ body: application() }), res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ role: "partner", email: "parceiro@exemplo.com.br" }), expect.anything())
    expect((createUser.mock.calls[0][0] as unknown as { hashed_password: string }).hashed_password).not.toBe("Parceria@2026")
    expect(createPartner).toHaveBeenCalledWith(expect.objectContaining({ user_id: "user-partner", document: "45781296000163", status: "pending" }), expect.anything())
    expect(body(res).partner).toMatchObject({ status: "pending" })
  })

  it("refuses a CNPJ with wrong check digits and an e-mail that already has an account", async () => {
    const createUser = jest.spyOn(User, "create")

    const invalid = mockResponse()
    await new ApplyPartnerController().handle(mockRequest({ body: application({ document: "45.781.296/0001-00" }) }), invalid)

    jest.spyOn(User, "findOne").mockResolvedValue({ id: "someone" } as never)
    const repeated = mockResponse()
    await new ApplyPartnerController().handle(mockRequest({ body: application() }), repeated)

    expect(invalid.status).toHaveBeenCalledWith(400)
    expect(repeated.status).toHaveBeenCalledWith(400)
    expect(body(repeated).error).toBe("Email is already in use")
    expect(createUser).not.toHaveBeenCalled()
  })

  it("asks a reason to refuse, and records who approved", async () => {
    const partner = stored({ id: partnerId, status: "pending" })
    jest.spyOn(Partner, "findByPk").mockResolvedValue(partner as never)

    const silent = mockResponse()
    await new ReviewPartnerController().handle(mockRequest({
      user: { id: "user-admin" },
      params: { id: partnerId },
      body: { decision: "refused" },
    } as never), silent)

    const approved = mockResponse()
    await new ReviewPartnerController().handle(mockRequest({
      user: { id: "user-admin" },
      params: { id: partnerId },
      body: { decision: "approved", note: "Bem-vindos à rede!" },
    } as never), approved)

    expect(silent.status).toHaveBeenCalledWith(400)
    expect(approved.status).toHaveBeenCalledWith(200)
    expect(partner.update).toHaveBeenCalledTimes(1)
    expect(partner.update).toHaveBeenCalledWith(expect.objectContaining({ status: "approved", reviewed_by: "user-admin" }))
  })

  it("shows on the site only approved companies that authorized the brand, and never their document", async () => {
    const findAll = jest.spyOn(Partner, "findAll").mockResolvedValue([
      { id: partnerId, company_name: "Horizonte Embalagens Ltda", logo_url: null, website: null, document: "45781296000163" },
    ] as never)

    const partners = await new ListPartnersService().execute()

    expect(findAll).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "approved", public_listing: true } }))
    expect(partners).toEqual([{ id: partnerId, name: "Horizonte Embalagens Ltda", logo: null, site: null }])
  })

  it("keeps a company under review out of the proposals, and a sponsorship without a target out of the queue", async () => {
    jest.spyOn(Partner, "findOne").mockResolvedValue({ id: partnerId, status: "pending" } as never)
    const create = jest.spyOn(PartnerProposal, "create")

    const pending = mockResponse()
    await new CreatePartnerProposalController().handle(mockRequest({
      user: { id: "user-partner" },
      body: { kind: "campaign", title: "Campanha de agasalhos", description: "Uma campanha de inverno para as famílias atendidas." },
    } as never), pending)

    const untargeted = mockResponse()
    await new CreatePartnerProposalController().handle(mockRequest({
      user: { id: "user-partner" },
      body: { kind: "sponsorship", title: "Patrocínio", description: "Patrocínio de uma ação da associação neste semestre.", amount: 3000 },
    } as never), untargeted)

    expect(pending.status).toHaveBeenCalledWith(403)
    expect(untargeted.status).toHaveBeenCalledWith(400)
    expect(create).not.toHaveBeenCalled()
  })

  it("asks a note on every answer to a proposal", async () => {
    const proposal = stored({ id: proposalId, status: "pending" })
    jest.spyOn(PartnerProposal, "findByPk").mockResolvedValue(proposal as never)

    const res = mockResponse()
    await new ReviewPartnerProposalController().handle(mockRequest({
      user: { id: "user-communication" },
      params: { id: proposalId },
      body: { decision: "accepted", note: "ok" },
    } as never), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(proposal.update).not.toHaveBeenCalled()
  })

  it("pays an accepted contribution through the same checkout as any donation, in the name and CNPJ of the company", async () => {
    jest.spyOn(Partner, "findOne").mockResolvedValue({
      id: partnerId,
      status: "approved",
      company_name: "Horizonte Embalagens Ltda",
      document: "45781296000163",
      phone: "19 3875-1200",
      public_listing: true,
      user: { email: "parceiro@exemplo.com.br" },
    } as never)
    const proposal = stored({ id: proposalId, kind: "contribution", status: "accepted", amount: "5000.00", campaign_id: campaignId, event_id: null, title: "Aporte para o Natal", transaction_id: null })
    jest.spyOn(PartnerProposal, "findOne").mockResolvedValue(proposal as never)
    const checkout = jest.spyOn(CreateTransactionService.prototype, "execute").mockResolvedValue({
      id: "transaction-1",
      checkout_url: "https://checkout.stripe.com/c/pay/cs_test_1",
    } as never)

    const res = mockResponse()
    await new PayPartnerProposalController().handle(mockRequest({ user: { id: "user-partner" }, params: { id: proposalId } } as never), res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(checkout).toHaveBeenCalledWith(expect.objectContaining({
      type: "donation",
      amount: "5000.00",
      campaign_id: campaignId,
      donor_name: "Horizonte Embalagens Ltda",
      donor_document: "45781296000163",
      donor_email: "parceiro@exemplo.com.br",
    }))
    expect(proposal.update).toHaveBeenCalledWith({ transaction_id: "transaction-1" })
    expect(body(res).payment).toEqual({ transaction_id: "transaction-1", checkout_url: "https://checkout.stripe.com/c/pay/cs_test_1" })
  })

  it("hands back the same checkout on a second click, and refuses what was already paid or not accepted", async () => {
    jest.spyOn(Partner, "findOne").mockResolvedValue({ id: partnerId, status: "approved", user: { email: "parceiro@exemplo.com.br" } } as never)
    const checkout = jest.spyOn(CreateTransactionService.prototype, "execute")
    const findOne = jest.spyOn(PartnerProposal, "findOne")
    const findTransaction = jest.spyOn(Transaction, "findByPk")

    findOne.mockResolvedValueOnce(stored({ id: proposalId, kind: "sponsorship", status: "accepted", amount: "3000.00", transaction_id: "transaction-1" }) as never)
    findTransaction.mockResolvedValueOnce({ id: "transaction-1", status: "pending", checkout_url: "https://checkout.stripe.com/c/pay/cs_test_1" } as never)
    const again = mockResponse()
    await new PayPartnerProposalController().handle(mockRequest({ user: { id: "user-partner" }, params: { id: proposalId } } as never), again)

    findOne.mockResolvedValueOnce(stored({ id: proposalId, kind: "sponsorship", status: "accepted", amount: "3000.00", transaction_id: "transaction-1" }) as never)
    findTransaction.mockResolvedValueOnce({ id: "transaction-1", status: "confirmed", checkout_url: null } as never)
    const paid = mockResponse()
    await new PayPartnerProposalController().handle(mockRequest({ user: { id: "user-partner" }, params: { id: proposalId } } as never), paid)

    findOne.mockResolvedValueOnce(stored({ id: proposalId, kind: "sponsorship", status: "refused", amount: "3000.00", transaction_id: null }) as never)
    const refused = mockResponse()
    await new PayPartnerProposalController().handle(mockRequest({ user: { id: "user-partner" }, params: { id: proposalId } } as never), refused)

    expect(again.status).toHaveBeenCalledWith(201)
    expect(body(again).payment.checkout_url).toBe("https://checkout.stripe.com/c/pay/cs_test_1")
    expect(paid.status).toHaveBeenCalledWith(400)
    expect(refused.status).toHaveBeenCalledWith(400)
    expect(checkout).not.toHaveBeenCalled()
  })

  it("answers 404 to the proposal of another company", async () => {
    jest.spyOn(Partner, "findOne").mockResolvedValue({ id: partnerId, status: "approved" } as never)
    jest.spyOn(PartnerProposal, "findOne").mockResolvedValue(null)

    const res = mockResponse()
    await new PayPartnerProposalController().handle(mockRequest({ user: { id: "user-partner" }, params: { id: proposalId } } as never), res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})
