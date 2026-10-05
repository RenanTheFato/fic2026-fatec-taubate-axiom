import PDFDocument from "pdfkit";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CERTIFICATE_FONTS, FONT_FACES, FONT_STYLES, faceKey, faceSource, fontFile } from "../utils/certificate-fonts.js";

// Gera a tabela de larguras de letra que o backend e o frontend usam para quebrar as linhas do
// certificado. Rodar de novo só quando uma fonte entrar ou sair de `utils/certificate-fonts.ts`:
//
//   npx tsx src/scripts/generate-certificate-font-metrics.ts
//
// As fontes embutidas vieram do repositório do Google Fonts (pasta `ofl/`), já instanciadas no
// peso certo e recortadas para os caracteres abaixo com o fontTools:
//   instancer.instantiateVariableFont(font, {"wght": peso}) e Subsetter com os mesmos códigos.
//
// A largura vem do próprio pdfkit, que é quem desenha o PDF: para as fontes-padrão, da tabela AFM
// que ele embute; para as outras, do arquivo da fonte. Sem kerning de propósito: o par de letras
// muda alguns centésimos de ponto e só atrapalharia a igualdade das duas pontas.

// Os caracteres que o PDF imprime: ASCII, Latin-1 e as aspas, travessões e símbolos que a
// codificação WinAnsi das fontes-padrão também tem.
const CODEPOINTS = [
  ...Array.from({ length: 0x7f - 0x20 }, (_, index) => 0x20 + index),
  ...Array.from({ length: 0x100 - 0xa0 }, (_, index) => 0xa0 + index),
  0x152, 0x153, 0x160, 0x161, 0x178, 0x17d, 0x17e, 0x192, 0x2c6, 0x2dc,
  0x2013, 0x2014, 0x2018, 0x2019, 0x201a, 0x201c, 0x201d, 0x201e,
  0x2020, 0x2021, 0x2022, 0x2026, 0x2030, 0x2039, 0x203a, 0x20ac, 0x2122,
]

type InternalFont = {
  ascender: number,
  descender: number,
  font: {
    unitsPerEm?: number,
    hasGlyphForCodePoint?: (codePoint: number) => boolean,
    glyphForCodePoint?: (codePoint: number) => { advanceWidth: number },
    characterToGlyph?: (codePoint: number) => string,
    widthOfGlyph?: (glyph: string) => number,
  },
}

function round(value: number) {
  return Math.round(value * 10) / 10
}

const document = new PDFDocument({ size: "A4", margin: 0 })
const metrics: Record<string, { ascender: number, descender: number, widths: number[] }> = {}

for (const font of CERTIFICATE_FONTS) {
  for (const style of FONT_STYLES) {
    if (!FONT_FACES[font][style]) {
      continue
    }

    const key = faceKey(font, style.startsWith("bold"), style.endsWith("italic"))
    const source = faceSource(key)

    if ("standard" in source) {
      document.font(source.standard)
    } else {
      document.registerFont(key, fontFile(source.file))
      document.font(key)
    }

    const current = (document as unknown as { _font: InternalFont })._font
    const widths = CODEPOINTS.map((codePoint) => {
      if (current.font.glyphForCodePoint && current.font.hasGlyphForCodePoint && current.font.unitsPerEm) {
        return current.font.hasGlyphForCodePoint(codePoint)
          ? round(current.font.glyphForCodePoint(codePoint).advanceWidth * 1000 / current.font.unitsPerEm)
          : -1
      }

      const glyph = current.font.characterToGlyph?.(codePoint) ?? ".notdef"

      return glyph === ".notdef" ? -1 : round(current.font.widthOfGlyph?.(glyph) ?? 0)
    })

    metrics[key] = { ascender: round(current.ascender), descender: round(current.descender), widths }
  }
}

const body = `// Gerado por backend/src/scripts/generate-certificate-font-metrics.ts. Não editar à mão.
//
// Largura de cada caractere imprimível, em milésimos do tamanho da letra, para cada face de fonte
// do certificado. -1 marca o caractere que a face não tem. O backend e o frontend têm cópias
// idênticas deste arquivo, e é isso que faz as linhas quebrarem no mesmo lugar nos dois.

export const FONT_CODEPOINTS = ${JSON.stringify(CODEPOINTS)}

export const FONT_METRICS: Record<string, { ascender: number, descender: number, widths: number[] }> = {
${Object.entries(metrics).map(([key, value]) => `  "${key}": { ascender: ${value.ascender}, descender: ${value.descender}, widths: ${JSON.stringify(value.widths)} },`).join("\n")}
}
`

const targets = [
  resolve(process.cwd(), "src/utils/certificate-font-metrics.ts"),
  resolve(process.cwd(), "../frontend/src/components/certificate/certificate-font-metrics.ts"),
]

for (const target of targets) {
  writeFileSync(target, body)
  console.log(`escrito: ${target}`)
}
