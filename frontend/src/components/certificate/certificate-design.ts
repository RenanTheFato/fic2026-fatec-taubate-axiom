import { CERTIFICATE_PAGE } from "../../types/certificate-types"
import type {
  CertificateAsset,
  CertificateDesign,
  CertificateElement,
  CertificateFont,
  CertificatePalette,
  CertificateShape,
  CertificateText,
} from "../../types/certificate-types"
import type { TransactionType } from "../../types/transaction-types"
import { formatCurrency } from "../../utils/format"
import { CODE_MIN_SIZE, QR_MIN_SIZE } from "./certificate-layout"
import type { DesignProblem } from "./certificate-layout"

// O vocabulário do estúdio: os campos que o certificado preenche, os dados de
// exemplo com que o editor os mostra, as paletas prontas, os nomes dos
// elementos e as mensagens de cada problema. Os textos de exemplo são os de
// `backend/src/utils/receipt-labels.ts`: se um mudar lá, muda aqui.
//
// Os hex daqui não são cor de interface, e por isso não viram token: são o
// conteúdo do documento que a associação escolhe, gravado no banco e impresso
// no PDF. A tela do painel continua usando só os tokens de `index.css`.

const { width: W, height: H } = CERTIFICATE_PAGE

export const CERTIFICATE_TITLE: Record<TransactionType, string> = {
  donation: "Certificado de Doação",
  sponsorship: "Certificado de Patrocínio",
  ticket: "Certificado de Participação",
  product: "Certificado de Apoio",
}

export const CERTIFICATE_DEED: Record<TransactionType, string> = {
  donation: "contribuiu com a doação de",
  sponsorship: "apoiou nossas ações como patrocinador, com",
  ticket: "esteve presente conosco, com a aquisição de ingresso no valor de",
  product: "apoiou nossas ações pela loja solidária, com",
}

export const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "donation", label: "Doação" },
  { value: "sponsorship", label: "Patrocínio" },
  { value: "ticket", label: "Convite" },
  { value: "product", label: "Loja" },
]

const ORGANIZATION = { name: "Associação Somos do Bem", document: "00.000.000/0001-00" }

// O mesmo código que a prévia em PDF usa, para a linha do registro ter a mesma
// largura nas duas.
export const SAMPLE_CODE = "5f3a9c1e7b2d4f8a6c0e9b3d1f7a5c2e8b4d6f0a3c9e1b7d5f2a8c4e6b0d9f3a"

export const FIELD_INFO: { key: string; label: string }[] = [
  { key: "nome", label: "Nome de quem contribuiu" },
  { key: "valor", label: "Valor" },
  { key: "titulo", label: "Título pelo tipo de apoio" },
  { key: "acao", label: "O que a pessoa fez" },
  { key: "destino", label: "Campanha ou evento" },
  { key: "data", label: "Data de emissão" },
  { key: "numero", label: "Número do recibo" },
  { key: "registro", label: "Posição na corrente" },
  { key: "codigo", label: "Código de verificação" },
  { key: "associacao", label: "Nome da associação" },
  { key: "cnpj", label: "CNPJ da associação" },
]

export function sampleFields(type: TransactionType, destination: string | null): Record<string, string> {
  return {
    nome: "Maria Aparecida Oliveira",
    valor: formatCurrency(type === "sponsorship" ? 5000 : 150),
    titulo: CERTIFICATE_TITLE[type],
    acao: CERTIFICATE_DEED[type],
    destino: destination ?? `às atividades da ${ORGANIZATION.name}`,
    numero: `${new Date().getFullYear()}/000123`,
    data: new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(new Date()),
    registro: "123",
    codigo: SAMPLE_CODE,
    associacao: ORGANIZATION.name,
    cnpj: ORGANIZATION.document,
  }
}

// Tema

export const PALETTE_FIELDS: { key: keyof CertificatePalette; label: string }[] = [
  { key: "paper", label: "Papel" },
  { key: "primary", label: "Principal" },
  { key: "secondary", label: "Secundária" },
  { key: "accent", label: "Detalhe" },
  { key: "ink", label: "Texto" },
  { key: "muted", label: "Texto de apoio" },
]

/** As cores que seguem o tema, na ordem em que o seletor de cor as oferece. */
export const THEME_SWATCHES: { color: string; label: string }[] = [
  ...PALETTE_FIELDS.map((field) => ({ color: `@${field.key}`, label: field.label })),
  { color: "@line", label: "Fio (papel com texto de apoio)" },
  { color: "@label", label: "Rótulo (detalhe escurecido)" },
  { color: "@contrast", label: "Sobre a faixa principal" },
]

// Paletas de partida. Trocar a paleta recolore tudo o que usa cor do tema e
// preserva o que foi pintado com uma cor própria.
export const PALETTE_PRESETS: { name: string; palette: CertificatePalette }[] = [
  {
    name: "Clássico",
    palette: { paper: "#FDFCF8", primary: "#064E3B", secondary: "#059669", accent: "#B98A2E", ink: "#1C1917", muted: "#78716C" },
  },
  {
    name: "Cores da marca",
    palette: { paper: "#FFFFFF", primary: "#0A7A73", secondary: "#00B3A6", accent: "#BB2DD7", ink: "#343937", muted: "#5C6260" },
  },
  {
    name: "Natal vermelho",
    palette: { paper: "#FFFBF2", primary: "#7F1D1D", secondary: "#B91C1C", accent: "#B98A2E", ink: "#2B1B17", muted: "#6E5A50" },
  },
  {
    name: "Natal verde",
    palette: { paper: "#FBFDF8", primary: "#14532D", secondary: "#15803D", accent: "#B98A2E", ink: "#1C2B22", muted: "#5D6B62" },
  },
  {
    name: "Páscoa",
    palette: { paper: "#FFF8F0", primary: "#5B3415", secondary: "#8B4A22", accent: "#C08A3E", ink: "#3B2A1E", muted: "#7A6656" },
  },
  {
    name: "Festa junina",
    palette: { paper: "#FFFBEB", primary: "#1E3A8A", secondary: "#B91C1C", accent: "#D97706", ink: "#1F2937", muted: "#6B5B3E" },
  },

]

export function isHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

// Elementos

export function newElementId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

const BASE = { rotation: 0, opacity: 1, locked: false }

export type TextPreset = "title" | "subtitle" | "body"

export const TEXT_PRESETS: { value: TextPreset; label: string; font: CertificateFont; size: number; bold: boolean }[] = [
  { value: "title", label: "Título", font: "cormorant", size: 36, bold: true },
  { value: "subtitle", label: "Subtítulo", font: "nunito", size: 18, bold: true },
  { value: "body", label: "Texto", font: "nunito", size: 12, bold: false },
]

export function createText(content: string, options: Partial<CertificateText> = {}): CertificateText {
  const width = options.width ?? 320
  const size = options.size ?? 14
  const lineHeight = options.line_height ?? 1.2

  return {
    ...BASE,
    id: newElementId("texto"),
    type: "text",
    content,
    x: Math.round((W - width) / 2),
    y: Math.round(H / 2 - (size * lineHeight) / 2),
    width,
    height: size * lineHeight,
    font: "nunito",
    size,
    bold: false,
    italic: false,
    underline: false,
    color: "@ink",
    align: "center",
    letter_spacing: 0,
    line_height: lineHeight,
    uppercase: false,
    fit: "wrap",
    ...options,
  }
}

export function createShape(shape: CertificateShape["shape"]): CertificateShape {
  const size = shape === "line" ? { width: 220, height: 2 } : { width: 160, height: shape === "ellipse" ? 160 : 100 }

  return {
    ...BASE,
    id: newElementId("forma"),
    type: "shape",
    shape,
    x: Math.round((W - size.width) / 2),
    y: Math.round((H - size.height) / 2),
    ...size,
    fill: shape === "line" ? null : "@primary",
    stroke: shape === "line" ? "@accent" : null,
    stroke_width: shape === "line" ? 2 : 0,
    radius: shape === "rect" ? 12 : 0,
    dash: "solid",
  }
}

export function createImage(asset: Pick<CertificateAsset, "id" | "width" | "height">): CertificateElement {
  const width = 120
  const height = Math.round((width * asset.height) / asset.width)

  return {
    ...BASE,
    id: newElementId("imagem"),
    type: "image",
    asset_id: asset.id,
    x: Math.round((W - width) / 2),
    y: Math.round((H - height) / 2),
    width,
    height,
    flip_x: false,
    flip_y: false,
  }
}

export function createLogo(): CertificateElement {
  return { ...BASE, id: newElementId("logo"), type: "logo", x: Math.round(W / 2 - 30), y: 40, width: 60, height: 60 }
}

export function createQr(): CertificateElement {
  return { ...BASE, id: "qr", type: "qr", x: Math.round(W / 2 - 38), y: H - 150, width: 76, height: 76, color: "@ink" }
}

// Nome do elemento na lista de camadas e nas mensagens: o começo do texto, com
// os campos pelo nome que a pessoa reconhece.
export function elementLabel(element: CertificateElement, assets?: Map<string, { name: string }>): string {
  switch (element.type) {
    case "text": {
      const readable = element.content
        .replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, key: string) => `[${FIELD_INFO.find((field) => field.key === key)?.label ?? key}]`)
        .replace(/\s+/g, " ")
        .trim()

      return readable.length > 40 ? `${readable.slice(0, 40)}…` : readable || "Texto vazio"
    }
    case "shape":
      return element.shape === "rect" ? "Retângulo" : element.shape === "ellipse" ? "Elipse" : "Linha"
    case "image":
      return assets?.get(element.asset_id)?.name ?? "Imagem"
    case "logo":
      return "Logo da associação"
    case "qr":
      return "QR de verificação"
  }
}

function ratio(value: number): string {
  return value.toFixed(1).replace(".", ",")
}

export function problemMessage(problem: DesignProblem): string {
  switch (problem.code) {
    case "duplicate-id":
      return "Dois elementos ficaram com o mesmo identificador. Apague a cópia e duplique de novo."
    case "qr-missing":
      return "Falta o QR de verificação. Insira-o pela aba Elementos."
    case "qr-duplicate":
      return "O certificado leva um QR só."
    case "qr-small":
      return `O QR precisa de ao menos ${QR_MIN_SIZE} pontos de lado para ser lido no papel.`
    case "qr-contrast":
      return `A cor do QR tem contraste de ${ratio(problem.ratio)}:1 com o branco. O mínimo é 4,5:1.`
    case "code-missing":
      return "Nenhum texto leva o código de verificação ({{codigo}})."
    case "code-small":
      return `O código de verificação precisa de letra com ao menos ${CODE_MIN_SIZE} pontos.`
    case "empty-text":
      return "Há um texto vazio."
    case "unknown-field":
      return `O campo {{${problem.field}}} não existe.`
    case "unsupported-char":
      return `A fonte deste texto não imprime "${problem.char}".`
    case "text-contrast":
      return `Contraste de ${ratio(problem.ratio)}:1 com o que está atrás. O mínimo é ${ratio(problem.required)}:1.`
  }
}

export function problemIndex(problem: DesignProblem): number | null {
  return "index" in problem ? problem.index : null
}

/** O desenho inteiro com outra paleta: o que segue o tema muda junto. */
export function withPalette(design: CertificateDesign, palette: CertificatePalette): CertificateDesign {
  return { ...design, palette }
}
