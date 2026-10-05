import { CERTIFICATE_PAGE } from "./certificate-design.js";
import type {
  CertificateDesignSpec,
  CertificateElement,
  CertificatePaint,
  CertificatePalette,
  CertificateShape,
  CertificateText,
} from "./certificate-design.js";
import { FONT_METRICS } from "./certificate-font-metrics.js";
import { faceKey } from "./certificate-fonts.js";
import type { CertificateFont } from "./certificate-fonts.js";
import { contrastRatio } from "./certificate-layout.js";

// O certificado com que a associação começou: moldura em degradê com losangos nos cantos, logo,
// título, o nome em destaque, o valor numa faixa e o rodapé com recibo, QR e assinatura. Aqui ele é
// montado como elementos soltos, iguais aos que o editor cria, para que qualquer versão nova possa
// partir dele e mexer em tudo. Recibo sem versão gravada sai com `FACTORY_DESIGN`.

const { width: W, height: H } = CERTIFICATE_PAGE
const CENTER = W / 2

export const FACTORY_PALETTE: CertificatePalette = {
  paper: "#FDFCF8",
  primary: "#064E3B",
  secondary: "#059669",
  accent: "#B98A2E",
  ink: "#1C1917",
  muted: "#78716C",
}

export interface ClassicSticker {
  asset_id: string,
  x: number,
  y: number,
  size: number,
  rotation?: number,
  opacity?: number,
}

export interface ClassicOptions {
  palette: CertificatePalette,
  font?: CertificateFont,
  frame?: boolean,
  title?: string | null,
  message?: string | null,
  background?: { asset_id: string, opacity: number } | null,
  stickers?: ClassicSticker[],
}

function round(value: number) {
  return Math.round(value * 100) / 100
}

function degrees(dy: number, dx: number) {
  return round((Math.atan2(dy, dx) * 180) / Math.PI)
}

interface TextOptions {
  x: number,
  width: number,
  size: number,
  font: CertificateFont,
  color: CertificatePaint,
  bold?: boolean,
  align?: CertificateText["align"],
  spacing?: number,
  uppercase?: boolean,
  fit?: CertificateText["fit"],
}

// `top` é onde começam as letras maiúsculas. A caixa do texto tem entrelinha de 1,2, metade acima
// e metade abaixo das letras, então ela começa um pouco antes.
function text(id: string, content: string, top: number, options: TextOptions): CertificateText {
  const bold = options.bold ?? false
  const metrics = FONT_METRICS[faceKey(options.font, bold, false)]
  const glyphs = ((metrics.ascender - metrics.descender) / 1000) * options.size
  const lead = (options.size * 1.2 - glyphs) / 2

  return {
    id,
    type: "text",
    content,
    x: round(options.x),
    y: round(top - lead),
    width: round(options.width),
    height: round(options.size * 1.2),
    rotation: 0,
    opacity: 1,
    locked: false,
    font: options.font,
    size: options.size,
    bold,
    italic: false,
    underline: false,
    color: options.color,
    align: options.align ?? "center",
    letter_spacing: options.spacing ?? 0,
    line_height: 1.2,
    uppercase: options.uppercase ?? false,
    fit: options.fit ?? "wrap",
  }
}

function shape(id: string, values: Partial<CertificateShape> & Pick<CertificateShape, "shape" | "x" | "y" | "width" | "height">): CertificateShape {
  return {
    id,
    type: "shape",
    rotation: 0,
    opacity: 1,
    locked: false,
    fill: null,
    stroke: null,
    stroke_width: 0,
    radius: 0,
    dash: "solid",
    ...values,
    x: round(values.x),
    y: round(values.y),
    width: round(values.width),
    height: round(values.height),
  }
}

// Linha horizontal: a caixa tem a espessura do traço, e o traço passa no meio dela.
function line(id: string, x: number, y: number, width: number, stroke: CertificatePaint, strokeWidth: number) {
  return shape(id, { shape: "line", x, y: y - strokeWidth / 2, width, height: strokeWidth, stroke, stroke_width: strokeWidth })
}

// Losango é um quadrado girado 45 graus em torno do próprio centro.
function diamond(id: string, cx: number, cy: number, radius: number) {
  const side = radius * Math.SQRT2

  return shape(id, { shape: "rect", x: cx - side / 2, y: cy - side / 2, width: side, height: side, rotation: 45, fill: "@accent" })
}

export function classicDesign(options: ClassicOptions): CertificateDesignSpec {
  const font = options.font ?? "helvetica"
  const message = options.message ?? null
  const elements: CertificateElement[] = []

  if (options.frame ?? true) {
    elements.push(
      shape("moldura", {
        shape: "rect",
        x: 24,
        y: 24,
        width: W - 48,
        height: H - 48,
        radius: 8,
        stroke: { stops: ["@primary", "@secondary", "@accent"], angle: degrees(H - 48, W - 48) },
        stroke_width: 2.5,
      }),
      shape("moldura-fina", { shape: "rect", x: 34, y: 34, width: W - 68, height: H - 68, radius: 5, stroke: "@line", stroke_width: 0.6 }),
      diamond("canto-1", 34, 34, 6),
      diamond("canto-2", W - 34, 34, 6),
      diamond("canto-3", 34, H - 34, 6),
      diamond("canto-4", W - 34, H - 34, 6),
    )
  }

  // Os enfeites ficam acima da moldura e abaixo de todo texto.
  for (const [index, sticker] of (options.stickers ?? []).entries()) {
    elements.push({
      id: `enfeite-${index + 1}`,
      type: "image",
      asset_id: sticker.asset_id,
      x: sticker.x,
      y: sticker.y,
      width: sticker.size,
      height: sticker.size,
      rotation: sticker.rotation ?? 0,
      opacity: sticker.opacity ?? 1,
      locked: false,
      flip_x: false,
      flip_y: false,
    })
  }

  const titleTop = 136
  const ornament = titleTop + 48
  const nameTop = ornament + 42
  const afterName = nameTop + 24 * 1.156
  const bandTop = afterName + 40
  const footerTop = H - 190 + (message ? 12 : 0)

  elements.push(
    { id: "logo", type: "logo", x: CENTER - 26, y: 48, width: 52, height: 52, rotation: 0, opacity: 1, locked: false },
    text("associacao", "{{associacao}}", 112, { x: 120, width: W - 240, size: 9, font, color: "@muted", spacing: 3, uppercase: true }),
    text("titulo", options.title ?? "{{titulo}}", titleTop, {
      x: 40,
      width: W - 80,
      size: 30,
      font,
      bold: true,
      color: { stops: ["@primary", "@secondary"], angle: degrees(34, 420) },
      fit: "shrink",
    }),
    line("linha-esquerda", CENTER - 110, ornament, 96, "@accent", 0.8),
    line("linha-direita", CENTER + 14, ornament, 96, "@accent", 0.8),
    diamond("losango", CENTER, ornament, 5),
    text("abertura", "Este certificado reconhece que", ornament + 18, { x: CENTER - 280, width: 560, size: 10.5, font, color: "@muted" }),
    text("nome", "{{nome}}", nameTop, { x: 80, width: W - 160, size: 24, font, bold: true, color: "@ink", fit: "shrink" }),
    text("acao", "{{acao}}", afterName + 12, { x: CENTER - 280, width: 560, size: 11.5, font, color: "@ink" }),
    shape("faixa-valor", {
      shape: "rect",
      x: CENTER - 130,
      y: bandTop,
      width: 260,
      height: 48,
      radius: 24,
      fill: { stops: ["@primary", "@secondary"], angle: degrees(48, 260) },
    }),
    text("valor", "{{valor}}", bandTop + 15, { x: CENTER - 130, width: 260, size: 21, font, bold: true, color: "@contrast", fit: "shrink" }),
    text("destino", "destinada {{destino}}.", bandTop + 62, { x: CENTER - 300, width: 600, size: 10, font, color: "@muted", fit: "shrink" }),
  )

  if (message) {
    elements.push(text("mensagem", message, bandTop + 80, { x: CENTER - 300, width: 600, size: 11, font, bold: true, color: "@label", fit: "shrink" }))
  }

  // O QR sai na cor principal quando ela é escura o bastante para qualquer câmera; senão, na tinta.
  const qrColor = contrastRatio(options.palette.primary, "#FFFFFF") >= 7 ? "@primary" : "@ink"

  elements.push(
    line("rodape", 70, footerTop, W - 140, "@line", 0.6),
    text("rotulo-recibo", "RECIBO Nº", footerTop + 22, { x: 70, width: 200, size: 7, font, color: "@label", spacing: 1.2, align: "left" }),
    text("numero", "{{numero}}", footerTop + 34, { x: 70, width: 200, size: 12, font, bold: true, color: "@ink", align: "left" }),
    text("rotulo-data", "EMITIDO EM", footerTop + 60, { x: 70, width: 200, size: 7, font, color: "@label", spacing: 1.2, align: "left" }),
    text("data", "{{data}}", footerTop + 72, { x: 70, width: 200, size: 10, font, color: "@ink", align: "left" }),
    { id: "qr", type: "qr", x: CENTER - 38, y: footerTop + 14, width: 76, height: 76, rotation: 0, opacity: 1, locked: false, color: qrColor },
    text("rotulo-qr", "VERIFIQUE A AUTENTICIDADE", footerTop + 94, { x: CENTER - 100, width: 200, size: 7, font, color: "@muted", spacing: 0.8 }),
    line("assinatura-linha", W - 290, footerTop + 66, 220, "@ink", 0.8),
    text("assinatura", "{{associacao}}", footerTop + 74, { x: W - 290, width: 220, size: 9.5, font, bold: true, color: "@ink" }),
    text("cnpj", "CNPJ {{cnpj}}", footerTop + 88, { x: W - 290, width: 220, size: 7.5, font, color: "@muted" }),
    text("registro", "registro #{{registro}}  ·  {{codigo}}", H - 52, { x: 60, width: W - 120, size: 6.5, font: "courier", color: "@muted", fit: "shrink" }),
  )

  return {
    palette: options.palette,
    background: {
      color: "@paper",
      asset_id: options.background?.asset_id ?? null,
      opacity: options.background?.opacity ?? 1,
    },
    elements,
  }
}

export const FACTORY_DESIGN = classicDesign({ palette: FACTORY_PALETTE })
