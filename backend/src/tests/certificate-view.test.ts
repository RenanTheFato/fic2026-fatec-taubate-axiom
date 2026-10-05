import { ViewReceiptCertificateController } from "../controllers/receipt/view-receipt-certificate-controller.js";
import { CertificateDesign } from "../models/certificate-design-model.js";
import { Receipt } from "../models/receipt-model.js";
import { Transaction } from "../models/transaction-model.js";
import { VerifyReceiptService } from "../services/receipt/verify-receipt-service.js";
import { classicDesign } from "../utils/certificate-classic.js";
import { mockRequest, mockResponse } from "./utils/mock-http.js";

const christmas = classicDesign({
  palette: { paper: "#FFFBF2", primary: "#7F1D1D", secondary: "#B91C1C", accent: "#B98A2E", ink: "#2B1B17", muted: "#6E5A50" },
  font: "times",
  title: "Certificado de Natal",
})

describe("Certificate second copy (the site draws an issued certificate by its code)", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })

  it("hands the site an issued certificate to draw, with its design, its fields and no donor document", async () => {
    jest.spyOn(Receipt, "findOne").mockResolvedValue({
      get: () => ({
        number: "2025/000043",
        sequence: 43,
        status: "issued",
        donor_name: "Marcelo Oliveira",
        donor_document: "12345678909",
        amount: "100.00",
        transaction_type: "donation",
        issued_at: new Date("2025-12-20T12:00:00.000Z"),
        cancelled_at: null,
        hash: "c".repeat(64),
        transaction_id: "transaction-1",
        certificate_design_id: "design-natal",
      }),
    } as never)
    jest.spyOn(VerifyReceiptService.prototype, "execute").mockResolvedValue({ authentic: true, valid: true } as never)
    jest.spyOn(CertificateDesign, "findByPk").mockResolvedValue({ design: christmas, version: 2, label: "Natal com neve" } as never)
    jest.spyOn(Transaction, "findByPk").mockResolvedValue({ campaign: { title: "Natal do Bem 2025" }, event: null } as never)

    const res = mockResponse()
    await new ViewReceiptCertificateController().handle(mockRequest({ params: { hash: "C".repeat(64) } } as never), res)

    expect(res.status).toHaveBeenCalledWith(200)
    const { certificate } = (res.json as jest.Mock).mock.calls[0][0]
    expect(certificate.valid).toBe(true)
    expect(certificate.version).toEqual({ version: 2, label: "Natal com neve" })
    expect(certificate.fields).toMatchObject({ nome: "Marcelo Oliveira", destino: "à campanha Natal do Bem 2025", codigo: "c".repeat(64) })
    expect(certificate.qr).toMatch(/^data:image\/svg\+xml;base64,/)
    expect(JSON.stringify(certificate)).not.toContain("12345678909")
  })

  it("answers 404 to a code no receipt carries", async () => {
    jest.spyOn(Receipt, "findOne").mockResolvedValue(null as never)

    const res = mockResponse()
    await new ViewReceiptCertificateController().handle(mockRequest({ params: { hash: "d".repeat(64) } } as never), res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})
