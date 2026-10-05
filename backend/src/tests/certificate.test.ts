import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CreateCertificateDesignController } from "../controllers/certificate/create-certificate-design-controller.js";
import { GetCertificateAssetController } from "../controllers/certificate/get-certificate-asset-controller.js";
import { UploadCertificateAssetController } from "../controllers/certificate/upload-certificate-asset-controller.js";
import { Campaign } from "../models/campaign-model.js";
import { CertificateAsset } from "../models/certificate-asset-model.js";
import { CertificateDesign } from "../models/certificate-design-model.js";
import { CreateCertificateDesignService } from "../services/certificate/create-certificate-design-service.js";
import { ResolveCertificateDesignService } from "../services/certificate/resolve-certificate-design-service.js";
import { BadRequestError } from "../config/errors.js";
import { FACTORY_DESIGN, classicDesign } from "../utils/certificate-classic.js";
import type { CertificateDesignSpec, CertificateText } from "../utils/certificate-design.js";
import { layoutText } from "../utils/certificate-layout.js";
import { readImageInfo } from "../utils/image-size.js";
import { buildReceiptCertificate } from "../utils/receipt-certificate-template.js";
import { mockRequest, mockResponse } from "./utils/mock-http.js";
import { mockSequelizeTransaction } from "./utils/mock-sequelize.js";

const STAR = readFileSync(resolve(process.cwd(), "src/assets/certificate/natal-estrela.png"))
const SNOW = readFileSync(resolve(process.cwd(), "src/assets/certificate/natal-fundo-neve.png"))
const assetId = "6f1f9d6a-2a55-4a77-9c55-3a1a3b0c2f10"
const snowId = "7a2e0c1b-3b66-4b88-8d66-4b2b4c1d3e21"
const campaignId = "2d0b6c0e-8f3c-4d6b-9a39-0f0d6a1b7c21"

function christmasDesign(): CertificateDesignSpec {
  return classicDesign({
    palette: { paper: "#FFFBF2", primary: "#7F1D1D", secondary: "#B91C1C", accent: "#B98A2E", ink: "#2B1B17", muted: "#6E5A50" },
    font: "times",
    title: "Certificado de Natal",
    message: "Obrigado por fazer o Natal de alguém mais feliz.",
    stickers: [{ asset_id: assetId, x: 60, y: 60, size: 70, rotation: -12 }],
  })
}

function withElement(design: CertificateDesignSpec, id: string, change: Record<string, unknown>): CertificateDesignSpec {
  return {
    ...design,
    elements: design.elements.map((element) => (element.id === id ? { ...element, ...change } as typeof element : element)),
  }
}

async function postDesign(design: unknown) {
  const res = mockResponse()

  await new CreateCertificateDesignController().handle(mockRequest({
    user: { id: "user-communication" },
    body: { scope: "default", target_id: null, label: "Teste", design },
  } as never), res)

  return res
}

function issueMessages(res: ReturnType<typeof mockResponse>) {
  const body = (res.json as jest.Mock).mock.calls[0][0]

  return (body.errors ?? []) as { message: string, path: string }[]
}

describe("Certificate studio (versions, library and rendering)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    mockSequelizeTransaction()
  })

  it("saves a customization as the next version of the folder, never over the previous one", async () => {
    jest.spyOn(Campaign, "findByPk").mockResolvedValue({ id: campaignId } as never)
    jest.spyOn(CertificateAsset, "count").mockResolvedValue(1 as never)
    jest.spyOn(CertificateDesign, "max").mockResolvedValue(2 as never)
    const create = jest.spyOn(CertificateDesign, "create").mockImplementation((async (values: Record<string, unknown>) => ({
      get: () => values,
    })) as never)

    const saved = await new CreateCertificateDesignService().execute({
      scope: "campaign",
      target_id: campaignId,
      label: "Natal com neve",
      design: christmasDesign(),
      created_by: "user-communication",
    })

    expect(saved.version).toBe(3)
    expect(saved.folder).toBe(`campaign:${campaignId}`)
    expect(saved.campaign_id).toBe(campaignId)
    expect(create).toHaveBeenCalledTimes(1)
  })

  it("refuses a design that points at an image the library doesn't have", async () => {
    jest.spyOn(Campaign, "findByPk").mockResolvedValue({ id: campaignId } as never)
    jest.spyOn(CertificateAsset, "count").mockResolvedValue(0 as never)
    const create = jest.spyOn(CertificateDesign, "create")

    await expect(new CreateCertificateDesignService().execute({
      scope: "campaign",
      target_id: campaignId,
      label: "Natal",
      design: christmasDesign(),
      created_by: null,
    })).rejects.toBeInstanceOf(BadRequestError)

    expect(create).not.toHaveBeenCalled()
  })

  it("accepts the factory design exactly as it is", async () => {
    const create = jest.spyOn(CreateCertificateDesignService.prototype, "execute").mockResolvedValue({ version: 1 } as never)

    const res = await postDesign(FACTORY_DESIGN)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(create).toHaveBeenCalledTimes(1)
  })

  it("refuses the donor name in a color that can't be read on the paper behind it", async () => {
    const index = FACTORY_DESIGN.elements.findIndex((element) => element.id === "nome")

    const res = await postDesign(withElement(FACTORY_DESIGN, "nome", { color: "#E7E5E4", size: 12 }))

    expect(res.status).toHaveBeenCalledWith(400)
    expect(issueMessages(res)[0].path).toBe(`design/elements/${index}/color`)
  })

  it("judges the contrast against the shape behind the text, not against the paper", async () => {
    // Texto claro sobre a faixa escura do valor é legível; o mesmo branco solto no papel não seria.
    const res = await postDesign(withElement(FACTORY_DESIGN, "valor", { color: "#FFFFFF" }))
    const loose = await postDesign(withElement(FACTORY_DESIGN, "abertura", { color: "#FFFFFF" }))

    expect(res.status).not.toHaveBeenCalledWith(400)
    expect(loose.status).toHaveBeenCalledWith(400)
  })

  it("refuses a certificate without its QR code or without the verification code", async () => {
    const withoutQr = { ...FACTORY_DESIGN, elements: FACTORY_DESIGN.elements.filter((element) => element.type !== "qr") }
    const withoutCode = withElement(FACTORY_DESIGN, "registro", { content: "registro #{{registro}}" })

    expect(issueMessages(await postDesign(withoutQr)).map((issue) => issue.message)).toContain("The certificate needs its verification QR code")
    expect(issueMessages(await postDesign(withoutCode)).map((issue) => issue.message)).toContain("A text must carry the verification code ({{codigo}})")
  })

  it("refuses a field the certificate doesn't know and a character the font can't print", async () => {
    const unknown = withElement(FACTORY_DESIGN, "abertura", { content: "Olá, {{apelido}}" })
    const emoji = withElement(FACTORY_DESIGN, "abertura", { content: "Feliz Natal 🎄" })

    expect(issueMessages(await postDesign(unknown))[0].message).toBe("Unknown field {{apelido}}")
    expect(issueMessages(await postDesign(emoji))[0].message).toContain("can't be printed")
  })

  it("shrinks the donor name to fit one line and wraps a long paragraph by words", () => {
    const name = FACTORY_DESIGN.elements.find((element) => element.id === "nome") as CertificateText
    const company = layoutText(name, { nome: "Construtora Alvorada Participações e Empreendimentos Imobiliários LTDA" })

    expect(company.lines).toHaveLength(1)
    expect(company.size).toBeLessThan(name.size)
    expect(company.lines[0].width).toBeLessThanOrEqual(name.width + 0.01)

    const paragraph = layoutText({ ...name, fit: "wrap", width: 200, content: "contribuiu com a doação que sustenta as oficinas da associação" }, {})

    expect(paragraph.lines.length).toBeGreaterThan(1)
    expect(paragraph.lines.every((line) => line.width <= 200.01)).toBe(true)
    expect(paragraph.lines.map((line) => line.text).join(" ")).toBe("contribuiu com a doação que sustenta as oficinas da associação")
  })

  it("gives a new receipt the newest version of the most specific folder: event, then campaign, then default", async () => {
    jest.spyOn(CertificateDesign, "findAll").mockResolvedValue([
      { id: "default-v2", folder: "default", version: 2 },
      { id: "campaign-v3", folder: `campaign:${campaignId}`, version: 3 },
      { id: "default-v1", folder: "default", version: 1 },
    ] as never)

    const resolver = new ResolveCertificateDesignService()

    expect(await resolver.execute({ campaign_id: campaignId, event_id: "event-without-design" })).toBe("campaign-v3")
    expect(await resolver.execute({ campaign_id: null, event_id: null })).toBe("default-v2")
  })

  it("leaves the receipt on the factory model when nothing was ever customized", async () => {
    jest.spyOn(CertificateDesign, "findAll").mockResolvedValue([] as never)

    expect(await new ResolveCertificateDesignService().execute({ campaign_id: campaignId, event_id: null })).toBeNull()
  })

  it("reads the image type from the bytes and refuses anything that is not PNG or JPEG", async () => {
    expect(readImageInfo(STAR)).toEqual({ mime_type: "image/png", width: 512, height: 512 })

    const create = jest.spyOn(CertificateAsset, "create")
    const res = mockResponse()

    await new UploadCertificateAssetController().handle(mockRequest({
      user: { id: "user-communication" },
      query: { name: "Arquivo disfarçado" },
      body: Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>"),
    } as never), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(create).not.toHaveBeenCalled()
  })

  it("stores an uploaded PNG and answers with its record, never with the file", async () => {
    jest.spyOn(CertificateAsset, "create").mockImplementation((async (values: Record<string, unknown>) => ({
      get: () => ({ id: assetId, ...values }),
    })) as never)

    const res = mockResponse()

    await new UploadCertificateAssetController().handle(mockRequest({
      user: { id: "user-communication" },
      query: { name: "Estrela dourada" },
      body: STAR,
    } as never), res)

    expect(res.status).toHaveBeenCalledWith(201)
    const { asset } = (res.json as jest.Mock).mock.calls[0][0]
    expect(asset.width).toBe(512)
    expect(asset).not.toHaveProperty("data")
  })

  it("serves an image as immutable and readable by the site's origin", async () => {
    jest.spyOn(CertificateAsset, "findByPk").mockResolvedValue({ mime_type: "image/png", data: STAR, size: STAR.length } as never)

    const res = mockResponse()
    res.set = jest.fn().mockReturnValue(res)

    await new GetCertificateAssetController().handle(mockRequest({ params: { id: assetId } } as never), res)

    const headers = (res.set as jest.Mock).mock.calls[0][0]
    expect(headers["Cache-Control"]).toContain("immutable")
    expect(headers["Cross-Origin-Resource-Policy"]).toBe("cross-origin")
  })

  it("renders a free design, with background, rotated image, gradient and an embedded font, on one landscape page", async () => {
    const design = withElement(
      { ...christmasDesign(), background: { color: "@paper", asset_id: snowId, opacity: 0.6 } },
      "nome",
      { font: "greatvibes", size: 40, rotation: -4 },
    )

    const pdf = await buildReceiptCertificate({
      number: "2026/000123",
      sequence: 123,
      status: "issued",
      donor_name: "Construtora Alvorada Participações e Empreendimentos Imobiliários LTDA",
      amount: "125000.90",
      transaction_type: "donation",
      issued_at: new Date("2026-12-10T12:00:00.000Z"),
      hash: "a".repeat(64),
    }, "http://localhost:5173/certificado/aaa", {
      design,
      assets: new Map([[assetId, STAR], [snowId, SNOW]]),
      destination: "à campanha Natal do Bem 2026",
    })

    const content = pdf.toString("latin1")
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-")
    expect(content.match(/\/Type\s*\/Page[^s]/g)).toHaveLength(1)
    expect(content).toContain("841.89 595.28")
    expect(content).toContain("GreatVibes")
  })
})
