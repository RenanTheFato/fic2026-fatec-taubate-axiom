import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { layoutText } from "../components/certificate/certificate-layout"
import { NotFoundError } from "../config/errors"
import CertificatePage from "../pages/public/certificate-page"
import type { CertificateText, CertificateView } from "../types/certificate-types"
import { fillField } from "./utils/fill-field"
import { renderWithProviders } from "./utils/render-with-providers"

const { getCertificateView, downloadCertificatePdf, downloadFile } = vi.hoisted(() => ({
  getCertificateView: vi.fn(),
  downloadCertificatePdf: vi.fn(),
  downloadFile: vi.fn(),
}))

vi.mock("../services/receipt/certificate-view-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getCertificateView,
  downloadCertificatePdf,
}))

vi.mock("../utils/pdf-file", () => ({ downloadFile, printPdf: vi.fn() }))

const HASH = "c".repeat(64)
const BASE = { rotation: 0, opacity: 1, locked: false }

const NAME: CertificateText = {
  ...BASE,
  id: "nome",
  type: "text",
  content: "{{nome}}",
  x: 80,
  y: 222.7,
  width: 681.89,
  height: 28.8,
  font: "helvetica",
  size: 24,
  bold: true,
  italic: false,
  underline: false,
  color: "@ink",
  align: "center",
  letter_spacing: 0,
  line_height: 1.2,
  uppercase: false,
  fit: "shrink",
}

const PALETTE = { paper: "#FFFBF2", primary: "#7F1D1D", secondary: "#B91C1C", accent: "#B98A2E", ink: "#2B1B17", muted: "#6E5A50" }
const QR = { ...BASE, id: "qr", type: "qr" as const, x: 383, y: 420, width: 76, height: 76, color: "@ink" }

function view(overrides: Partial<CertificateView> = {}): CertificateView {
  return {
    number: "2025/000043",
    status: "issued",
    transaction_type: "donation",
    issued_at: "2025-12-20T12:00:00.000Z",
    cancelled_at: null,
    hash: HASH,
    authentic: true,
    valid: true,
    variants: {
      amount: {
        version: { version: 2, label: "Natal 2025 com neve" },
        design: {
          palette: PALETTE,
          background: { color: "@paper", asset_id: null, opacity: 1 },
          elements: [NAME, { ...NAME, id: "valor", y: 280, content: "{{valor}}" }, QR],
        },
        qr: "data:image/svg+xml;base64,PHN2Zy8+",
      },
      message: {
        version: null,
        design: {
          palette: PALETTE,
          background: { color: "@paper", asset_id: null, opacity: 1 },
          elements: [NAME, { ...NAME, id: "valor", y: 280, content: "Obrigado por fazer o bem" }, QR],
        },
        qr: "data:image/svg+xml;base64,PHN2Zy8+",
      },
    },
    fields: { nome: "Marcelo Oliveira", valor: "R$ 100,00", codigo: HASH },
    ...overrides,
  }
}

function renderAt(path: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/certificado" element={<CertificatePage />} />
      <Route path="/certificado/:hash" element={<CertificatePage />} />
    </Routes>,
    path,
  )
}

describe("quebra de linha do certificado", () => {
  // Os números vêm do backend (`utils/certificate-layout.ts`) para os mesmos
  // textos. Se um lado mudar a conta e o outro não, este teste é quem avisa:
  // o editor mostraria uma linha que o PDF quebra em outro lugar.
  it("encolhe o nome igual ao PDF", () => {
    const layout = layoutText(NAME, { nome: "Construtora Alvorada Participações e Empreendimentos Imobiliários LTDA" })

    expect(layout.size).toBe(19)
    expect(layout.lines).toHaveLength(1)
    expect(layout.lines[0].x).toBeCloseTo(81.5, 2)
    expect(layout.lines[0].baseline).toBeCloseTo(238.954, 2)
  })

  it("quebra caligrafia e itálico nas mesmas palavras que o PDF", () => {
    const script = layoutText(
      { ...NAME, font: "greatvibes", bold: false, fit: "wrap", width: 260, size: 30, content: "Que a sua generosidade ilumine o Natal de muitas famílias" },
      {},
    )
    const italic = layoutText(
      { ...NAME, font: "nunito", bold: false, italic: true, fit: "wrap", width: 200, size: 11, align: "right", letter_spacing: 1, content: "{{acao}} {{valor}}, destinada {{destino}}." },
      { acao: "contribuiu com a doação de", valor: "R$ 150,00", destino: "à campanha Natal do Bem 2026" },
    )

    expect(script.lines.map((line) => line.text)).toEqual(["Que a sua generosidade", "ilumine o Natal de muitas", "famílias"])
    expect(italic.lines.map((line) => line.text)).toEqual(["contribuiu com a doação de", "R$ 150,00, destinada à campanha", "Natal do Bem 2026."])
    expect(italic.lines.map((line) => Number(line.x.toFixed(2)))).toEqual([120.43, 81.66, 163.45])
  })
})

describe("segunda via do certificado", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Quem contribuiu decide se o certificado mostra o valor. A escolha muda o que
  // a tela desenha e o PDF que sai.
  it("deixa escolher o certificado com o valor, com a mensagem ou os dois", async () => {
    const user = userEvent.setup()
    getCertificateView.mockResolvedValue(view())
    downloadCertificatePdf.mockResolvedValue(new Blob(["%PDF"]))

    renderAt(`/certificado/${HASH}`)

    const amount = await screen.findByRole("img", { name: /certificado com o valor/i })
    expect(amount).toHaveTextContent("R$ 100,00")

    await user.click(screen.getByRole("radio", { name: /com uma mensagem/i }))

    const message = screen.getByRole("img", { name: /certificado com a mensagem/i })
    expect(message).toHaveTextContent("Obrigado por fazer o bem")
    expect(message).not.toHaveTextContent("R$ 100,00")
    expect(screen.queryByRole("img", { name: /certificado com o valor/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /baixar pdf/i }))
    expect(downloadCertificatePdf).toHaveBeenLastCalledWith(HASH, "message")

    await user.click(screen.getByRole("radio", { name: /os dois/i }))
    expect(screen.getAllByRole("img", { name: /certificado com/i })).toHaveLength(2)

    await user.click(screen.getByRole("button", { name: /baixar pdf/i }))
    expect(downloadCertificatePdf).toHaveBeenLastCalledWith(HASH, "both")
    expect(downloadFile).toHaveBeenLastCalledWith(expect.any(Blob), "certificado-2025-000043-completo.pdf")
  })

  it("mostra o certificado do código, com o nome escrito e o veredito da corrente", async () => {
    getCertificateView.mockResolvedValue(view())

    renderAt(`/certificado/${HASH}`)

    expect(await screen.findByText(/certificado autêntico e válido/i)).toBeInTheDocument()
    expect(getCertificateView).toHaveBeenCalledWith(HASH)
    expect(screen.getByRole("img", { name: /certificado com o valor de marcelo oliveira/i })).toHaveTextContent("Marcelo Oliveira")
    expect(screen.getByRole("button", { name: /baixar pdf/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /imprimir/i })).toBeInTheDocument()
  })

  it("marca o certificado cancelado com a tarja, como o PDF", async () => {
    getCertificateView.mockResolvedValue(view({ status: "cancelled", valid: false, cancelled_at: "2026-01-10T12:00:00.000Z" }))

    renderAt(`/certificado/${HASH}`)

    expect(await screen.findByText(/autêntico, mas cancelado/i)).toBeInTheDocument()
    expect(screen.getByRole("img", { name: /certificado com o valor de marcelo oliveira/i })).toHaveTextContent("CANCELADO")
  })

  it("aceita o código colado com espaços ou dentro do endereço do QR", async () => {
    const user = userEvent.setup()
    getCertificateView.mockResolvedValue(view())

    renderAt("/certificado")

    await fillField(user, /código do certificado/i, `https://somosdobem.org.br/certificado/${"C".repeat(32)} ${"c".repeat(32)}`)
    await user.click(screen.getByRole("button", { name: /ver certificado/i }))

    expect(await screen.findByText(/certificado autêntico e válido/i)).toBeInTheDocument()
    expect(getCertificateView).toHaveBeenCalledWith(HASH)
  })

  it("explica quando nenhum certificado tem o código", async () => {
    getCertificateView.mockRejectedValue(new NotFoundError("Certificado não encontrado"))

    renderAt(`/certificado/${"d".repeat(64)}`)

    expect(await screen.findByText(/nenhum certificado com este código/i)).toBeInTheDocument()
  })
})
