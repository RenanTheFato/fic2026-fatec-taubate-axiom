import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// As famílias de letra que o editor de certificado oferece. Três são as fontes-padrão do PDF, que
// todo leitor já tem. As outras cinco são arquivos livres (SIL Open Font License, a licença vai na
// mesma pasta) guardados em `src/assets/fonts`, recortados para o alfabeto do português e
// embutidos no PDF só quando o desenho usa. O frontend carrega os mesmos arquivos em WOFF2, e as
// larguras de letra dos dois lados saem da mesma tabela (`certificate-font-metrics.ts`): é isso que
// faz uma frase quebrar no mesmo lugar no editor e no certificado.

export const CERTIFICATE_FONTS = ["helvetica", "times", "courier", "nunito", "cormorant", "cinzel", "caveat", "greatvibes"] as const

export type CertificateFont = typeof CERTIFICATE_FONTS[number]

export const FONT_STYLES = ["regular", "bold", "italic", "bolditalic"] as const

export type FontStyle = typeof FONT_STYLES[number]

type FaceSource = { standard: string } | { file: string }

export const FONT_FACES: Record<CertificateFont, Partial<Record<FontStyle, FaceSource>>> = {
  helvetica: {
    regular: { standard: "Helvetica" },
    bold: { standard: "Helvetica-Bold" },
    italic: { standard: "Helvetica-Oblique" },
    bolditalic: { standard: "Helvetica-BoldOblique" },
  },
  times: {
    regular: { standard: "Times-Roman" },
    bold: { standard: "Times-Bold" },
    italic: { standard: "Times-Italic" },
    bolditalic: { standard: "Times-BoldItalic" },
  },
  courier: {
    regular: { standard: "Courier" },
    bold: { standard: "Courier-Bold" },
    italic: { standard: "Courier-Oblique" },
    bolditalic: { standard: "Courier-BoldOblique" },
  },
  nunito: {
    regular: { file: "Nunito-Regular.ttf" },
    bold: { file: "Nunito-ExtraBold.ttf" },
    italic: { file: "Nunito-Italic.ttf" },
    bolditalic: { file: "Nunito-ExtraBoldItalic.ttf" },
  },
  cormorant: {
    regular: { file: "CormorantGaramond-Medium.ttf" },
    bold: { file: "CormorantGaramond-Bold.ttf" },
    italic: { file: "CormorantGaramond-MediumItalic.ttf" },
    bolditalic: { file: "CormorantGaramond-BoldItalic.ttf" },
  },
  cinzel: {
    regular: { file: "Cinzel-Regular.ttf" },
    bold: { file: "Cinzel-Bold.ttf" },
  },
  caveat: {
    regular: { file: "Caveat-Regular.ttf" },
    bold: { file: "Caveat-Bold.ttf" },
  },
  greatvibes: {
    regular: { file: "GreatVibes-Regular.ttf" },
  },
}

// Família que não tem a variação pedida (a caligráfica não tem negrito) cai na mais próxima que
// tem, em vez de o PDF inventar um negrito borrado. O editor desliga o botão nesses casos.
export function fontStyle(font: CertificateFont, bold: boolean, italic: boolean): FontStyle {
  const faces = FONT_FACES[font]
  const wanted: FontStyle[] = bold && italic
    ? ["bolditalic", "bold", "italic", "regular"]
    : bold
      ? ["bold", "regular"]
      : italic
        ? ["italic", "regular"]
        : ["regular"]

  return wanted.find((style) => faces[style]) ?? "regular"
}

export function faceKey(font: CertificateFont, bold: boolean, italic: boolean) {
  return `${font}:${fontStyle(font, bold, italic)}`
}

export function faceSource(key: string): FaceSource {
  const [font, style] = key.split(":") as [CertificateFont, FontStyle]
  const source = FONT_FACES[font]?.[style]

  if (!source) {
    throw new Error(`Unknown certificate font face: ${key}`)
  }

  return source
}

export function fontFile(file: string) {
  return resolve(process.cwd(), "src/assets/fonts", file)
}

// O arquivo é lido uma vez por processo: cada PDF registra a fonte a partir do buffer em memória,
// e o pdfkit embute só os caracteres que aquele certificado usa.
const fileCache = new Map<string, Buffer>()

export function selectFace(document: PDFKit.PDFDocument, key: string, registered: Set<string>) {
  const source = faceSource(key)

  if ("standard" in source) {
    document.font(source.standard)
    return
  }

  if (!registered.has(key)) {
    let buffer = fileCache.get(source.file)

    if (!buffer) {
      buffer = readFileSync(fontFile(source.file))
      fileCache.set(source.file, buffer)
    }

    document.registerFont(key, buffer)
    registered.add(key)
  }

  document.font(key)
}
