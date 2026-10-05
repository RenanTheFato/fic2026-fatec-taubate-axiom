import { sequelize } from "../config/sequelize.js";
import { ListCampaignSupportersController } from "../controllers/supporter/list-campaign-supporters-controller.js";
import { ListSupportersController } from "../controllers/supporter/list-supporters-controller.js";
import { Campaign } from "../models/campaign-model.js";
import { ListSupportersService } from "../services/supporter/list-supporters-service.js";
import { mockRequest, mockResponse } from "./utils/mock-http.js";

type QueryCall = [string, { replacements: Record<string, unknown> }]

function stubQueries(names: string[], counts = { listed: names.length, contributors: names.length + 2 }) {
  return jest.spyOn(sequelize, "query").mockImplementation((async (sql: string) =>
    sql.includes("COUNT(") ? [counts] : names.map((name) => ({ name }))
  ) as never)
}

describe("Supporters wall (names only, random order, consent first)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("orders by a seeded hash and never reads the amount", async () => {
    const query = stubQueries(["Ana Lima", "Bruno Gomes"])

    await new ListSupportersService().execute({ scope: {}, seed: "abc123", page: 1, limit: 120 })

    const [listing] = query.mock.calls as unknown as QueryCall[]
    const sql = listing[0]

    expect(sql).toContain("ORDER BY SHA2(CONCAT(:seed, d.id), 256)")
    expect(sql).not.toMatch(/amount/i)
    expect(listing[1].replacements.seed).toBe("abc123")
  })

  it("lists only confirmed contributions with consent, and never an anonymized donor", async () => {
    const query = stubQueries(["Ana Lima"])

    await new ListSupportersService().execute({ scope: {}, seed: null, page: 1, limit: 120 })

    const sql = (query.mock.calls[0] as unknown as QueryCall)[0]

    expect(sql).toContain("t.public_recognition = 1")
    expect(sql).toContain("t.status = 'confirmed'")
    expect(sql).toContain("d.anonymized_at IS NULL")
  })

  it("answers names alone, with no value, date or count per person", async () => {
    stubQueries(["Ana Lima", "Cobreq Indústria"])

    const res = mockResponse()
    await new ListSupportersController().handle(mockRequest({ query: { seed: "s1" } } as never), res)

    expect(res.status).toHaveBeenCalledWith(200)

    const body = (res.json as jest.Mock).mock.calls[0][0]
    expect(body.supporters).toEqual([{ name: "Ana Lima" }, { name: "Cobreq Indústria" }])
    expect(body.seed).toBe("s1")
    expect(body.contributors).toBe(4)
  })

  it("draws a new seed when none is sent, so every visit shuffles the wall", async () => {
    stubQueries([])

    const first = await new ListSupportersService().execute({ scope: {}, seed: null, page: 1, limit: 10 })
    const second = await new ListSupportersService().execute({ scope: {}, seed: null, page: 1, limit: 10 })

    expect(first.seed).toMatch(/^[0-9a-f]{12}$/)
    expect(first.seed).not.toBe(second.seed)
  })

  it("gathers a campaign's wall from its own donations and from the events that sustain it", async () => {
    jest.spyOn(Campaign, "findOne").mockResolvedValue({ id: "campaign-natal" } as never)
    const query = stubQueries(["Ana Lima"])

    const res = mockResponse()
    await new ListCampaignSupportersController().handle(mockRequest({ params: { slug: "natal-do-bem-2026" }, query: {} } as never), res)

    expect(res.status).toHaveBeenCalledWith(200)

    const [sql, options] = query.mock.calls[0] as unknown as QueryCall
    expect(sql).toContain("t.campaign_id = :campaign_id OR t.event_id IN (SELECT e.id FROM events e WHERE e.campaign_id = :campaign_id)")
    expect(options.replacements.campaign_id).toBe("campaign-natal")
  })

  it("answers 404 for a campaign that is not public", async () => {
    jest.spyOn(Campaign, "findOne").mockResolvedValue(null)

    const res = mockResponse()
    await new ListCampaignSupportersController().handle(mockRequest({ params: { slug: "rascunho" }, query: {} } as never), res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it("refuses a seed that could be anything other than letters and numbers", async () => {
    const query = stubQueries([])

    const res = mockResponse()
    await new ListSupportersController().handle(mockRequest({ query: { seed: "1'); DROP TABLE donors; --" } } as never), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(query).not.toHaveBeenCalled()
  })
})
