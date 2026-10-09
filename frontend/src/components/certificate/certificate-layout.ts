import type {
  CertificateDesign as CertificateDesignSpec,
  CertificateElement,
  CertificatePaint,
  CertificatePalette,
  CertificateText,
} from "../../types/certificate-types"
import { FONT_CODEPOINTS, FONT_METRICS } from "./certificate-font-metrics"
import { faceKey } from "./certificate-fonts"

// A matemática do certificado que o backend e o frontend precisam fazer igual: resolver as cores do
// tema, medir e quebrar o texto, saber o que está atrás de cada elemento e o que torna um desenho
// impossível de salvar. Este arquivo é a cópia de `backend/src/utils/certificate-layout.ts` e só
// muda nos imports. Se uma regra mudar lá, muda aqui, senão o editor mostra uma quebra de linha que
// o PDF não faz, ou deixa salvar um desenho que o backend recusa.

// Cor

export const PALETTE_ROLES = ["paper", "primary", "secondary", "accent", "ink", "muted"] as const

export type PaletteRole = typeof PALETTE_ROLES[number]

// Tons que não são escolhidos, e sim calculados da paleta: o fio fino (papel com um pouco do texto
// de apoio), o rótulo pequeno (detalhe escurecido pela tinta) e o texto sobre a faixa em degradê
// das duas cores principais, que vira branco ou tinta conforme o que contrasta mais.
export const DERIVED_ROLES = ["line", "label", "contrast"] as const

export type DerivedRole = typeof DERIVED_ROLES[number]

function channels(color: string) {
  const value = color.replace("#", "")

  return [0, 2, 4].map((start) => parseInt(value.slice(start, start + 2), 16))
}

function luminance(color: string) {
  const [red, green, blue] = channels(color).map((channel) => {
    const normalized = channel / 255
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export function contrastRatio(first: string, second: string) {
  const [light, dark] = [luminance(first), luminance(second)].sort((left, right) => right - left)

  return (light + 0.05) / (dark + 0.05)
}

export function mix(first: string, second: string, weight: number) {
  const left = channels(first)
  const right = channels(second)

  return "#" + left
    .map((channel, index) => Math.round(channel * (1 - weight) + right[index] * weight))
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()
}

export function textOn(fill: string, ink: string) {
  return contrastRatio(fill, "#FFFFFF") >= contrastRatio(fill, ink) ? "#FFFFFF" : ink
}

// "@primary" segue a paleta; "#7F1D1D" é uma cor fixa. É o que deixa trocar o tema inteiro do
// certificado de uma vez sem perder a cor que alguém escolheu à mão para um enfeite.
export function resolveColor(color: string, palette: CertificatePalette) {
  if (!color.startsWith("@")) {
    return color.toUpperCase()
  }

  const role = color.slice(1)

  if (role === "line") return mix(palette.paper, palette.muted, 0.28)
  if (role === "label") return mix(palette.accent, palette.ink, 0.35)
  if (role === "contrast") return textOn(mix(palette.primary, palette.secondary, 0.5), palette.ink)

  return (palette[role as PaletteRole] ?? "#000000").toUpperCase()
}

export function isGradient(paint: CertificatePaint): paint is Exclude<CertificatePaint, string> {
  return typeof paint === "object" && paint !== null
}

export function paintStops(paint: CertificatePaint, palette: CertificatePalette) {
  return isGradient(paint) ? paint.stops.map((stop) => resolveColor(stop, palette)) : [resolveColor(paint, palette)]
}

// O degradê atravessa a caixa do elemento no ângulo pedido (0 da esquerda para a direita, 90 de
// cima para baixo) e cobre a caixa inteira, como o `linear-gradient` do CSS.
export function gradientLine(angle: number, box: { x: number, y: number, width: number, height: number }) {
  const radians = (angle * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const half = (Math.abs(box.width * cos) + Math.abs(box.height * sin)) / 2
  const center = elementCenter(box)

  return { x1: center.x - cos * half, y1: center.y - sin * half, x2: center.x + cos * half, y2: center.y + sin * half }
}

// Campos

// O que o certificado preenche com os dados de cada recibo. Texto com {{nome}} vira o nome de quem
// contribuiu; o resto do texto é escrito pela associação.
export const CERTIFICATE_FIELDS = [
  "nome",
  "valor",
  "titulo",
  "acao",
  "destino",
  "numero",
  "data",
  "registro",
  "codigo",
  "associacao",
  "cnpj",
] as const

export type CertificateField = typeof CERTIFICATE_FIELDS[number]

// O que o certificado afirma. Texto que carrega um destes precisa do contraste de leitura comum,
// e não só do de texto decorativo.
export const ESSENTIAL_FIELDS: readonly string[] = ["nome", "valor", "numero", "data", "registro", "codigo"]

const FIELD_PATTERN = /\{\{\s*([a-z_]+)\s*\}\}/g

export function fieldsIn(content: string) {
  return [...content.matchAll(FIELD_PATTERN)].map((match) => match[1])
}

export function fillFields(content: string, values: Partial<Record<string, string>>) {
  return content.replace(FIELD_PATTERN, (match, field: string) => values[field] ?? match)
}

// Texto

const CODEPOINT_INDEX = new Map(FONT_CODEPOINTS.map((codePoint, index) => [codePoint, index]))
const QUESTION_MARK = CODEPOINT_INDEX.get(63) as number

function advance(face: string, char: string) {
  const index = CODEPOINT_INDEX.get(char.codePointAt(0) ?? 0)
  const widths = FONT_METRICS[face].widths
  const width = index === undefined ? -1 : widths[index]

  return width >= 0 ? width : widths[QUESTION_MARK]
}

export function supports(face: string, char: string) {
  const index = CODEPOINT_INDEX.get(char.codePointAt(0) ?? 0)

  return index !== undefined && FONT_METRICS[face].widths[index] >= 0
}

// Um nome com letra que a fonte não tem ("ł") perde só o acento quando dá ("l"), e vira "?" quando
// não dá. É melhor do que o PDF deixar um buraco no nome de quem doou.
export function printable(text: string, face: string) {
  let output = ""

  for (const char of text.replace(/\t/g, " ")) {
    if (char === "\n" || supports(face, char)) {
      output += char
      continue
    }

    const base = char.normalize("NFD")[0]
    output += base && supports(face, base) ? base : "?"
  }

  return output
}

export function measureText(text: string, face: string, size: number, spacing: number) {
  let total = 0
  let count = 0

  for (const char of text) {
    total += advance(face, char)
    count += 1
  }

  return (total * size) / 1000 + spacing * Math.max(count - 1, 0)
}

// Quebra gulosa por palavra, e por letra quando uma palavra sozinha não cabe (o código de 64
// caracteres numa caixa estreita, por exemplo).
export function wrapLines(paragraph: string, maxWidth: number, measure: (text: string) => number) {
  const limit = maxWidth + 0.01
  const lines: string[] = []
  let current = ""

  for (const word of paragraph.split(" ")) {
    const candidate = current === "" ? word : `${current} ${word}`

    if (measure(candidate) <= limit) {
      current = candidate
      continue
    }

    if (current !== "") {
      lines.push(current)
      current = ""
    }

    if (measure(word) <= limit) {
      current = word
      continue
    }

    let chunk = ""

    for (const char of word) {
      if (chunk !== "" && measure(chunk + char) > limit) {
        lines.push(chunk)
        chunk = char
      } else {
        chunk += char
      }
    }

    current = chunk
  }

  lines.push(current)

  return lines
}

export interface TextLine {
  text: string,
  width: number,
  x: number,
  baseline: number,
}

export interface TextLayout {
  face: string,
  size: number,
  lineHeight: number,
  height: number,
  lines: TextLine[],
}

// "Reduzir para caber" encolhe a letra até cada parágrafo caber numa linha, até 60% do tamanho
// escolhido. É o comportamento certo para o nome de quem doou: uma razão social longa tem cinco
// vezes o comprimento de um nome de pessoa, e quebrar o nome em duas linhas desmonta a página.
export const SHRINK_FLOOR = 0.6

export function layoutText(element: CertificateText, values: Partial<Record<string, string>>): TextLayout {
  const face = faceKey(element.font, element.bold, element.italic)
  const filled = fillFields(element.content, values)
  const text = printable(element.uppercase ? filled.toLocaleUpperCase("pt-BR") : filled, face)
  const paragraphs = text.split("\n")
  const spacing = element.letter_spacing

  let size = element.size

  if (element.fit === "shrink") {
    const floor = Math.max(4, Math.round(element.size * SHRINK_FLOOR * 2) / 2)
    const widest = (candidate: number) => Math.max(...paragraphs.map((paragraph) => measureText(paragraph, face, candidate, spacing)))

    while (size > floor && widest(size) > element.width + 0.01) {
      size = Math.max(floor, size - 0.5)
    }
  }

  const measure = (line: string) => measureText(line, face, size, spacing)
  const lines = paragraphs.flatMap((paragraph) => wrapLines(paragraph, element.width, measure))
  const metrics = FONT_METRICS[face]
  const lineHeight = size * element.line_height

  // A entrelinha se divide meio a meio acima e abaixo das letras, como no CSS. A linha de base da
  // primeira linha fica a essa metade mais a altura das maiúsculas abaixo do topo da caixa.
  const glyphs = ((metrics.ascender - metrics.descender) / 1000) * size
  const firstBaseline = (lineHeight - glyphs) / 2 + (metrics.ascender / 1000) * size

  return {
    face,
    size,
    lineHeight,
    height: lines.length * lineHeight,
    lines: lines.map((line, index) => {
      const width = measure(line)
      const offset = element.align === "center"
        ? (element.width - width) / 2
        : element.align === "right"
          ? element.width - width
          : 0

      return { text: line, width, x: element.x + offset, baseline: element.y + firstBaseline + index * lineHeight }
    }),
  }
}

// Geometria

type Box = { x: number, y: number, width: number, height: number }

export function elementCenter(box: Box) {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

export function rotatePoint(point: { x: number, y: number }, center: { x: number, y: number }, degrees: number) {
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const dx = point.x - center.x
  const dy = point.y - center.y

  return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos }
}

export function containsPoint(element: CertificateElement, point: { x: number, y: number }) {
  const center = elementCenter(element)
  const local = rotatePoint(point, center, -element.rotation)
  const dx = local.x - center.x
  const dy = local.y - center.y

  if (element.type === "shape" && element.shape === "line") {
    return false
  }

  if (element.type === "shape" && element.shape === "ellipse") {
    return (dx / (element.width / 2)) ** 2 + (dy / (element.height / 2)) ** 2 <= 1
  }

  return Math.abs(dx) <= element.width / 2 && Math.abs(dy) <= element.height / 2
}

// Verificação

// As cores possíveis atrás de um ponto, olhando do elemento para baixo. `null` é "não dá para
// saber": uma foto ou uma forma translúcida estão no caminho, e a conta de contraste não se aplica.
export function backdropAt(design: CertificateDesignSpec, index: number, point: { x: number, y: number }): string[] | null {
  for (let position = index - 1; position >= 0; position -= 1) {
    const below = design.elements[position]

    if (!containsPoint(below, point)) {
      continue
    }

    if (below.type === "qr") {
      return ["#FFFFFF"]
    }

    if (below.type === "image" || below.type === "logo") {
      return null
    }

    if (below.type === "shape" && below.fill) {
      return below.opacity < 0.95 ? null : paintStops(below.fill, design.palette)
    }
  }

  if (design.background.asset_id && design.background.opacity > 0.5) {
    return null
  }

  return [resolveColor(design.background.color, design.palette)]
}

export function textContrast(design: CertificateDesignSpec, index: number) {
  const element = design.elements[index] as CertificateText
  const backdrop = backdropAt(design, index, elementCenter(element))

  if (!backdrop) {
    return null
  }

  let ratio = Infinity

  for (const back of backdrop) {
    for (const color of paintStops(element.color, design.palette)) {
      const seen = element.opacity < 1 ? mix(back, color, element.opacity) : color
      ratio = Math.min(ratio, contrastRatio(seen, back))
    }
  }

  const large = element.size >= 18 || (element.bold && element.size >= 14)
  const essential = fieldsIn(element.content).some((field) => ESSENTIAL_FIELDS.includes(field))

  return { ratio, required: essential && !large ? 4.5 : 3 }
}

// O QR precisa caber na câmera de um celular depois de impresso, e o código precisa ser legível
// por quem prefere digitá-lo.
export const QR_MIN_SIZE = 56
export const CODE_MIN_SIZE = 5

export type DesignProblem =
  | { code: "duplicate-id", index: number }
  | { code: "qr-missing" }
  | { code: "qr-duplicate", index: number }
  | { code: "qr-small", index: number }
  | { code: "qr-contrast", index: number, ratio: number }
  | { code: "code-missing" }
  | { code: "code-small", index: number }
  | { code: "empty-text", index: number }
  | { code: "unknown-field", index: number, field: string }
  | { code: "unsupported-char", index: number, char: string }
  | { code: "text-contrast", index: number, ratio: number, required: number }

// O que impede um desenho de virar certificado. O backend recusa ao salvar e o editor mostra a
// mesma lista enquanto a pessoa desenha, a partir desta mesma função.
export function designProblems(design: CertificateDesignSpec): DesignProblem[] {
  const problems: DesignProblem[] = []
  const ids = new Set<string>()
  let qrCodes = 0
  let carriesCode = false

  design.elements.forEach((element, index) => {
    if (ids.has(element.id)) {
      problems.push({ code: "duplicate-id", index })
    }

    ids.add(element.id)

    if (element.type === "qr") {
      qrCodes += 1

      if (qrCodes > 1) {
        problems.push({ code: "qr-duplicate", index })
      }

      if (Math.min(element.width, element.height) < QR_MIN_SIZE) {
        problems.push({ code: "qr-small", index })
      }

      const ratio = contrastRatio(resolveColor(element.color, design.palette), "#FFFFFF")

      if (ratio < 4.5) {
        problems.push({ code: "qr-contrast", index, ratio })
      }
    }

    if (element.type !== "text") {
      return
    }

    if (element.content.trim().length === 0) {
      problems.push({ code: "empty-text", index })
      return
    }

    const fields = fieldsIn(element.content)
    const unknown = fields.find((field) => !(CERTIFICATE_FIELDS as readonly string[]).includes(field))

    if (unknown) {
      problems.push({ code: "unknown-field", index, field: unknown })
    }

    if (fields.includes("codigo")) {
      carriesCode = true

      if (element.size < CODE_MIN_SIZE) {
        problems.push({ code: "code-small", index })
      }
    }

    const face = faceKey(element.font, element.bold, element.italic)
    const literal = element.content.replace(FIELD_PATTERN, "")
    const written = element.uppercase ? literal.toLocaleUpperCase("pt-BR") : literal
    const missing = [...written].find((char) => char !== "\n" && !supports(face, char))

    if (missing) {
      problems.push({ code: "unsupported-char", index, char: missing })
    }

    const contrast = textContrast(design, index)

    if (contrast && contrast.ratio < contrast.required) {
      problems.push({ code: "text-contrast", index, ...contrast })
    }
  })

  if (qrCodes === 0) {
    problems.push({ code: "qr-missing" })
  }

  if (!carriesCode) {
    problems.push({ code: "code-missing" })
  }

  return problems
}
