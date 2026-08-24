import PDFDocument from "pdfkit";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { organization } from "../config/organization.js";

// Camada baixa dos documentos em PDF: montar o documento, carregar a logo e formatar número e data.
// Os templates (o recibo institucional e o certificado) usam estas funções e não conhecem nada de
// banco; os services não conhecem nada de desenho.

export interface PdfPageOptions {
  title: string,
  landscape?: boolean,
  // Margem só existe para texto que flui. Num layout de posição absoluta, como o do certificado,
  // ela vira armadilha: o pdfkit abre uma página nova assim que uma linha encosta na margem
  // inferior, e o documento sai com uma segunda folha em branco.
  margin?: number,
}

export async function renderPdf(options: PdfPageOptions, draw: (document: PDFKit.PDFDocument) => void) {
  const document = new PDFDocument({
    size: "A4",
    layout: options.landscape ? "landscape" : "portrait",
    margin: options.margin ?? 56,
    info: { Title: options.title },
  })

  const chunks: Buffer[] = []

  document.on("data", (chunk: Buffer) => chunks.push(chunk))
  const rendered = new Promise<Buffer>((resolve) => {
    document.on("end", () => resolve(Buffer.concat(chunks)))
  })

  draw(document)
  document.end()

  return await rendered
}

// A logo é lida uma vez e fica em memória: o arquivo não muda em tempo de execução, e reler o disco
// a cada recibo emitido seria custo puro. `null` é resposta válida — o template desenha o nome.
const logoCache = new Map<string, Buffer | null>()

export function loadLogo(variant: "color" | "mono") {
  const paths = variant === "mono"
    ? [organization.logo_mono, organization.logo]
    : [organization.logo]

  const key = variant

  if (logoCache.has(key)) {
    return logoCache.get(key) ?? null
  }

  for (const path of paths) {
    try {
      const file = readFileSync(resolve(process.cwd(), path))
      logoCache.set(key, file)
      return file
    } catch {
      continue
    }
  }

  logoCache.set(key, null)
  return null
}

// A conversão para número acontece só para imprimir. O valor gravado continua sendo a string do
// DECIMAL e nenhuma conta é feita sobre este número.
export function formatMoney(amount: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(amount))
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date))
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date))
}
