import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import CertificateEditorPage from "../pages/admin/certificate-editor-page"
import CertificatesPage from "../pages/admin/certificates-page"
import type { CertificateAsset, CertificateDesign, CertificateFolder, CertificateText, CertificateVersion } from "../types/certificate-types"
import type { User, UserRole } from "../types/user-types"
import { fillField } from "./utils/fill-field"
import { renderWithProviders } from "./utils/render-with-providers"

const { getProfile, listCertificateFolders, listIssuedCertificates, listCertificateDesigns, createCertificateDesign, listCertificateAssets } =
  vi.hoisted(() => ({
    getProfile: vi.fn(),
    listCertificateFolders: vi.fn(),
    listIssuedCertificates: vi.fn(),
    listCertificateDesigns: vi.fn(),
    createCertificateDesign: vi.fn(),
    listCertificateAssets: vi.fn(),
  }))

vi.mock("../services/auth/get-profile-service", () => ({ getProfile }))

vi.mock("../services/certificate/certificate-folders-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  listCertificateFolders,
  listIssuedCertificates,
}))

vi.mock("../services/certificate/certificate-designs-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  listCertificateDesigns,
  createCertificateDesign,
}))

vi.mock("../services/certificate/certificate-assets-service", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  listCertificateAssets,
}))

const CAMPAIGN_ID = "13131313-1313-4131-8131-131313131313"
const FOLDER = `campaign:${CAMPAIGN_ID}`
const STAR = "24242424-2424-4242-8242-242424242424"

const BASE = { rotation: 0, opacity: 1, locked: false }

// O texto que carrega o valor. É ele que separa as duas variações: o
// certificado com valor precisa dele, o com mensagem não pode tê-lo.
const AMOUNT: CertificateText = {
  ...BASE,
  id: "valor",
  type: "text",
  content: "{{valor}}",
  x: 290,
  y: 280,
  width: 260,
  height: 25.2,
  font: "helvetica",
  size: 21,
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

// Um certificado mínimo e válido: o nome, o valor, a linha com o código e o QR.
const DESIGN: CertificateDesign = {
  palette: { paper: "#FFFBF2", primary: "#7F1D1D", secondary: "#B91C1C", accent: "#B98A2E", ink: "#2B1B17", muted: "#6E5A50" },
  background: { color: "@paper", asset_id: null, opacity: 1 },
  elements: [
    {
      ...BASE,
      id: "nome",
      type: "text",
      content: "{{nome}}",
      x: 80,
      y: 220,
      width: 680,
      height: 28.8,
      font: "times",
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
    },
    {
      ...BASE,
      id: "registro",
      type: "text",
      content: "registro #{{registro}}  ·  {{codigo}}",
      x: 60,
      y: 540,
      width: 720,
      height: 7.8,
      font: "courier",
      size: 6.5,
      bold: false,
      italic: false,
      underline: false,
      color: "@muted",
      align: "center",
      letter_spacing: 0,
      line_height: 1.2,
      uppercase: false,
      fit: "shrink",
    },
    { ...BASE, id: "qr", type: "qr", x: 383, y: 420, width: 76, height: 76, color: "@ink" },
    AMOUNT,
  ],
}

// A mesma página com uma mensagem no lugar do valor.
const MESSAGE_DESIGN: CertificateDesign = {
  ...DESIGN,
  elements: DESIGN.elements.map((element) => (element.id === "valor" ? { ...AMOUNT, content: "Obrigado por fazer o bem" } : element)),
}

function variants(amount: CertificateFolder["variants"]["amount"]): CertificateFolder["variants"] {
  return { amount, message: { versions: 0, current: null } }
}

const FOLDERS: CertificateFolder[] = [
  { folder: "default", scope: "default", target_id: null, title: "Modelo padrão", status: null, versions: 1, issued: 40, variants: variants({ versions: 1, current: { id: "d1", version: 1, label: "Modelo institucional", created_at: "2025-08-01T12:00:00.000Z" } }) },
  { folder: FOLDER, scope: "campaign", target_id: CAMPAIGN_ID, title: "Natal do Bem 2025", status: "finished", versions: 2, issued: 37, variants: variants({ versions: 2, current: { id: "v2", version: 2, label: "Natal 2025 com neve", created_at: "2025-11-27T12:00:00.000Z" } }) },
]

function version(overrides: Partial<CertificateVersion>): CertificateVersion {
  return {
    id: "v1",
    scope: "campaign",
    campaign_id: CAMPAIGN_ID,
    event_id: null,
    folder: FOLDER,
    variant: "amount",
    version: 1,
    label: "Natal 2025 vermelho e dourado",
    design: DESIGN,
    created_by: "user-1",
    created_at: "2025-10-28T12:00:00.000Z",
    updated_at: "2025-10-28T12:00:00.000Z",
    author: { id: "user-1", name: "Comunicação Somos do Bem" },
    issued: 18,
    ...overrides,
  }
}

const ASSETS: CertificateAsset[] = [
  { id: STAR, name: "Estrela dourada", mime_type: "image/png", width: 512, height: 512, size: 20861, uploaded_by: null, created_at: "2025-08-01T12:00:00.000Z", updated_at: "2025-08-01T12:00:00.000Z" },
]

function signedInAs(role: UserRole) {
  const user: User = {
    id: "user-1",
    name: "Equipe Somos do Bem",
    email: "equipe@somosdobem.org.br",
    role,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  }

  window.localStorage.setItem("somosdobem.token", "token-de-teste")
  getProfile.mockResolvedValue(user)
}

function renderEditor(variant = "valor") {
  return renderWithProviders(
    <Routes>
      <Route path="/admin/comunicacao/certificados/editor" element={<CertificateEditorPage />} />
      <Route path="/admin/comunicacao/certificados" element={<p>estúdio</p>} />
    </Routes>,
    `/admin/comunicacao/certificados/editor?pasta=${encodeURIComponent(FOLDER)}&variante=${variant}`,
  )
}

// Os atalhos do editor valem para a página, e não para um campo com foco.
function pressOnPage(key: string, options: Partial<KeyboardEventInit> = {}) {
  ;(document.activeElement as HTMLElement | null)?.blur()
  fireEvent.keyDown(window, { key, ...options })
}

describe("estúdio de certificados", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listCertificateFolders.mockResolvedValue({ folders: FOLDERS, factory: { amount: DESIGN, message: MESSAGE_DESIGN } })
    listCertificateAssets.mockResolvedValue(ASSETS)
    listCertificateDesigns.mockImplementation(async (folder: string, variant: string) => {
      if (variant === "message") return []

      return folder === "default"
        ? [version({ id: "d1", scope: "default", campaign_id: null, folder: "default", label: "Modelo institucional", issued: 40 })]
        : [version({ id: "v2", version: 2, label: "Natal 2025 com neve", issued: 19 }), version({})]
    })
    listIssuedCertificates.mockResolvedValue({
      certificates: [
        {
          id: "r1",
          number: "2025/000043",
          sequence: 43,
          donor_name: "Marcelo Oliveira",
          amount: "100.00",
          transaction_type: "donation",
          status: "issued",
          issued_at: "2025-12-20T12:00:00.000Z",
          hash: "c".repeat(64),
          certificate_design_id: "v2",
          design_version: 2,
          design_label: "Natal 2025 com neve",
        },
      ],
      total: 1,
    })
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it("abre a pasta da campanha com todas as versões, da mais nova para a mais antiga", async () => {
    signedInAs("communication")

    renderWithProviders(<CertificatesPage />, `/admin/comunicacao/certificados?pasta=${encodeURIComponent(FOLDER)}`)

    expect(await screen.findByRole("heading", { name: "Natal do Bem 2025", level: 2 })).toBeInTheDocument()

    const history = screen.getByRole("heading", { name: /histórico de versões/i }).closest("section") as HTMLElement
    const titles = within(history).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)
    expect(titles).toEqual(["Versão 2", "Versão 1"])
    expect(within(history).getByText(/19 recibos/i)).toBeInTheDocument()

    // A lista de emitidos traz nome de doador: a Comunicação vê só as contagens.
    expect(listIssuedCertificates).not.toHaveBeenCalled()
    expect(screen.queryByRole("heading", { name: /certificados emitidos/i, level: 2 })).not.toBeInTheDocument()
  })

  it("mostra à Administração os certificados emitidos, com a versão de cada um", async () => {
    signedInAs("admin")

    renderWithProviders(<CertificatesPage />, `/admin/comunicacao/certificados?pasta=${encodeURIComponent(FOLDER)}`)

    expect((await screen.findAllByText("Marcelo Oliveira")).length).toBeGreaterThan(0)
    expect(listIssuedCertificates).toHaveBeenCalledWith(FOLDER, 1)
    expect(screen.getAllByRole("link", { name: /abrir o certificado do recibo 2025\/000043/i })[0]).toHaveAttribute(
      "href",
      expect.stringContaining(`/receipt/certificate/${"c".repeat(64)}`),
    )
  })

  it("insere um texto, edita, move pelo teclado e salva como a próxima versão", async () => {
    signedInAs("communication")
    const user = userEvent.setup()
    createCertificateDesign.mockResolvedValue(version({ id: "v3", version: 3, label: "Natal com mensagem" }))

    renderEditor()

    await user.click(await screen.findByRole("button", { name: /adicionar texto/i }))

    const content = screen.getByLabelText(/^conteúdo$/i)
    await user.clear(content)
    await user.type(content, "Feliz Natal")

    pressOnPage("ArrowRight", { shiftKey: true })
    pressOnPage("ArrowDown")

    expect(screen.getByLabelText(/^x$/i)).toHaveValue("281")

    await user.click(screen.getByRole("button", { name: /^salvar$/i }))
    await fillField(user, /nome desta versão/i, "Natal com mensagem")
    await user.click(screen.getByRole("button", { name: /salvar versão 3/i }))

    await waitFor(() => expect(createCertificateDesign).toHaveBeenCalledTimes(1))
    const input = createCertificateDesign.mock.calls[0][0]
    expect(input).toEqual(expect.objectContaining({ scope: "campaign", target_id: CAMPAIGN_ID, variant: "amount", label: "Natal com mensagem" }))
    expect(input.design.elements).toHaveLength(5)
    expect(input.design.elements[4]).toEqual(expect.objectContaining({ type: "text", content: "Feliz Natal", x: 281, y: 291 }))
    expect(await screen.findByText("estúdio")).toBeInTheDocument()
  })

  it("aponta o que falta sem travar o salvar, e desfaz com Ctrl+Z", async () => {
    signedInAs("communication")
    const user = userEvent.setup()

    renderEditor()

    await user.click(await screen.findByRole("tab", { name: /camadas/i }))
    await user.click(screen.getByRole("button", { name: /^qr de verificação$/i }))
    pressOnPage("Delete")

    expect(await screen.findByRole("button", { name: /1 aviso/i })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /1 aviso/i }))
    expect(screen.getByText(/falta o qr de verificação/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /^salvar$/i }))
    expect(screen.getByText("A verificação tem 1 aviso.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /salvar versão 3/i })).toBeEnabled()
    expect(screen.getByRole("button", { name: /prévia em pdf/i })).toBeEnabled()

    pressOnPage("z", { ctrlKey: true })

    expect(await screen.findByRole("button", { name: /sem avisos/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^qr de verificação$/i })).toBeInTheDocument()
  })

  it("separa as duas variações da pasta, e o certificado com mensagem parte do modelo sem valor", async () => {
    signedInAs("communication")
    const user = userEvent.setup()

    renderWithProviders(<CertificatesPage />, `/admin/comunicacao/certificados?pasta=${encodeURIComponent(FOLDER)}`)

    const message = await screen.findByRole("button", { name: /com mensagem/i })
    expect(screen.getByRole("button", { name: /com valor/i })).toHaveAttribute("aria-pressed", "true")

    await user.click(message)

    expect(await screen.findByRole("heading", { name: /histórico de versões com mensagem/i })).toBeInTheDocument()
    expect(listCertificateDesigns).toHaveBeenCalledWith(FOLDER, "message")
    expect(screen.getByRole("link", { name: /criar a primeira versão/i })).toHaveAttribute("href", expect.stringContaining("variante=mensagem"))
  })

  it("avisa quando o certificado com mensagem mostra o valor, e salva se a equipe quiser", async () => {
    signedInAs("communication")
    const user = userEvent.setup()
    createCertificateDesign.mockResolvedValue(version({ id: "m1", variant: "message", label: "Natal com mensagem" }))
    listCertificateDesigns.mockImplementation(async (_folder: string, variant: string) =>
      variant === "message" ? [version({ id: "m0", variant: "message", design: DESIGN })] : [version({})],
    )

    renderEditor("mensagem")

    expect(await screen.findByRole("button", { name: /1 aviso/i })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /1 aviso/i }))
    expect(screen.getByText(/mostra o valor \(\{\{valor\}\}\) no certificado com mensagem/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /^salvar$/i }))
    await fillField(user, /nome desta versão/i, "Mensagem com o valor")
    await user.click(screen.getByRole("button", { name: /salvar versão 2/i }))

    await waitFor(() => expect(createCertificateDesign).toHaveBeenCalledTimes(1))
    expect(createCertificateDesign.mock.calls[0][0]).toEqual(expect.objectContaining({ variant: "message", label: "Mensagem com o valor" }))
  })
})
