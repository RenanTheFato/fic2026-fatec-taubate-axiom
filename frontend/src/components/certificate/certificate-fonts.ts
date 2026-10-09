import type { CertificateDesign, CertificateFont } from "../../types/certificate-types"

// As famílias de letra do certificado, espelhando `utils/certificate-fonts.ts`
// do backend. Três são as fontes-padrão do PDF, que a tela mostra com as
// equivalentes de mesma largura (Arial e Liberation desenham Helvetica com as
// mesmas medidas). As outras cinco são os mesmos arquivos que o PDF embute, em
// WOFF2, servidos de `public/fonts/certificado` e carregados só quando um
// desenho usa. A quebra de linha não depende de a fonte ter carregado: ela sai
// da tabela de larguras, igual nos dois lados.

export type FontStyle = "regular" | "bold" | "italic" | "bolditalic"

type FontFamily = {
  label: string
  /** Para o que serve, na lista de escolha. */
  hint: string
  /** Família CSS de uma fonte-padrão do PDF. */
  css?: string
  /** Arquivo de cada variação de uma fonte embutida. */
  files?: Partial<Record<FontStyle, string>>
}

const ALL_STYLES: FontStyle[] = ["regular", "bold", "italic", "bolditalic"]

export const FONT_FAMILIES: Record<CertificateFont, FontFamily> = {
  helvetica: {
    label: "Helvetica",
    hint: "Sem serifa, neutra",
    css: "Helvetica, Arial, 'Liberation Sans', 'Nimbus Sans', sans-serif",
  },
  times: {
    label: "Times",
    hint: "Com serifa, de documento",
    css: "'Times New Roman', Times, 'Liberation Serif', 'Nimbus Roman', serif",
  },
  courier: {
    label: "Courier",
    hint: "Máquina de escrever",
    css: "'Courier New', Courier, 'Liberation Mono', 'Nimbus Mono PS', monospace",
  },
  nunito: {
    label: "Nunito",
    hint: "A letra do site",
    files: {
      regular: "Nunito-Regular.woff2",
      bold: "Nunito-ExtraBold.woff2",
      italic: "Nunito-Italic.woff2",
      bolditalic: "Nunito-ExtraBoldItalic.woff2",
    },
  },
  cormorant: {
    label: "Cormorant Garamond",
    hint: "Serifa clássica e elegante",
    files: {
      regular: "CormorantGaramond-Medium.woff2",
      bold: "CormorantGaramond-Bold.woff2",
      italic: "CormorantGaramond-MediumItalic.woff2",
      bolditalic: "CormorantGaramond-BoldItalic.woff2",
    },
  },
  cinzel: {
    label: "Cinzel",
    hint: "Maiúsculas romanas, para títulos",
    files: { regular: "Cinzel-Regular.woff2", bold: "Cinzel-Bold.woff2" },
  },
  caveat: {
    label: "Caveat",
    hint: "Escrita à mão",
    files: { regular: "Caveat-Regular.woff2", bold: "Caveat-Bold.woff2" },
  },
  greatvibes: {
    label: "Great Vibes",
    hint: "Caligrafia, para nomes",
    files: { regular: "GreatVibes-Regular.woff2" },
  },
}

export const FONT_ORDER = Object.keys(FONT_FAMILIES) as CertificateFont[]

export function availableStyles(font: CertificateFont): FontStyle[] {
  const family = FONT_FAMILIES[font]

  return family.css ? ALL_STYLES : ALL_STYLES.filter((style) => family.files?.[style])
}

// Família sem a variação pedida cai na mais próxima que tem, igual ao backend.
export function fontStyle(font: CertificateFont, bold: boolean, italic: boolean): FontStyle {
  const available = availableStyles(font)
  const wanted: FontStyle[] =
    bold && italic ? ["bolditalic", "bold", "italic", "regular"] : bold ? ["bold", "regular"] : italic ? ["italic", "regular"] : ["regular"]

  return wanted.find((style) => available.includes(style)) ?? "regular"
}

export function faceKey(font: CertificateFont, bold: boolean, italic: boolean): string {
  return `${font}:${fontStyle(font, bold, italic)}`
}

function faceName(key: string): string {
  return `certificado-${key.replace(":", "-")}`
}

export type CssFont = { fontFamily: string; fontWeight: number; fontStyle: "normal" | "italic" }

export function cssFont(key: string): CssFont {
  const [font, style] = key.split(":") as [CertificateFont, FontStyle]
  const family = FONT_FAMILIES[font]

  if (family.css) {
    return {
      fontFamily: family.css,
      fontWeight: style.startsWith("bold") ? 700 : 400,
      fontStyle: style.endsWith("italic") ? "italic" : "normal",
    }
  }

  return { fontFamily: `'${faceName(key)}'`, fontWeight: 400, fontStyle: "normal" }
}

const requested = new Set<string>()

// Registra no documento as faces de arquivo pedidas. O navegador redesenha o
// texto sozinho quando o arquivo chega; até lá, mostra a letra de reserva, com
// as linhas já quebradas no lugar certo.
export function ensureFaces(keys: Iterable<string>): void {
  if (typeof FontFace === "undefined" || typeof document === "undefined" || !document.fonts) return

  for (const key of keys) {
    if (requested.has(key)) continue

    const [font, style] = key.split(":") as [CertificateFont, FontStyle]
    const file = FONT_FAMILIES[font]?.files?.[style]

    if (!file) continue

    requested.add(key)
    const face = new FontFace(faceName(key), `url(/fonts/certificado/${file}) format("woff2")`)
    document.fonts.add(face)
    face.load().catch(() => requested.delete(key))
  }
}

export function loadDesignFonts(design: CertificateDesign): void {
  ensureFaces(
    design.elements.flatMap((element) => (element.type === "text" ? [faceKey(element.font, element.bold, element.italic)] : [])),
  )
}
