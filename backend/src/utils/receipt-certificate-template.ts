import { toBuffer } from "qrcode";
import { FACTORY_DESIGN } from "./certificate-classic.js";
import type {
  CertificateDesignSpec,
  CertificateElement,
  CertificatePaint,
  CertificatePalette,
  CertificateShape,
  CertificateText,
} from "./certificate-design.js";
import { certificateFields } from "./certificate-fields.js";
import type { CertificateReceipt } from "./certificate-fields.js";
import { selectFace } from "./certificate-fonts.js";
import { elementCenter, gradientLine, isGradient, layoutText, resolveColor } from "./certificate-layout.js";
import { loadLogo, renderPdf } from "./pdf-document.js";

export type { CertificateReceipt } from "./certificate-fields.js";

// Certificado: paisagem, colorido, feito para o doador guardar, imprimir e mostrar. Carrega os
// mesmos dados do recibo institucional e o mesmo QR de verificação: muda a roupa, não o conteúdo.
//
// O desenho vem de uma versão do estúdio (`utils/certificate-design.ts`): o fundo da página e uma
// lista de elementos, desenhados na ordem da lista, do fundo para a frente, exatamente como o
// editor mostra. A conta de quebra de linha é a mesma do editor (`certificate-layout.ts`).

export interface CertificateOptions {
  design?: CertificateDesignSpec | null,
  // As imagens de fundo e dos elementos, já lidas do banco pelo service. Uma imagem que falte aqui
  // é pulada, e não um erro: o certificado continua válido sem o enfeite.
  assets?: Map<string, Buffer>,
  // "à campanha Natal do Bem 2026", "ao evento Chefs do Bem". Ausente, vale a associação.
  destination?: string | null,
  // Prévia do editor: os dados são de exemplo, e a tarja impede que o arquivo circule como se
  // fosse um certificado emitido.
  sample?: boolean,
}

type Box = { x: number, y: number, width: number, height: number }

function paintFor(document: PDFKit.PDFDocument, paint: CertificatePaint, palette: CertificatePalette, box: Box) {
  if (!isGradient(paint)) {
    return resolveColor(paint, palette)
  }

  const { x1, y1, x2, y2 } = gradientLine(paint.angle, box)
  const gradient = document.linearGradient(x1, y1, x2, y2)

  paint.stops.forEach((stop, index) => {
    gradient.stop(index / (paint.stops.length - 1), resolveColor(stop, palette))
  })

  return gradient
}

function drawCover(document: PDFKit.PDFDocument, image: Buffer, width: number, height: number) {
  // Fundo preenche a página inteira, cortando o que sobra, como `object-fit: cover`. A medida da
  // imagem vem do próprio pdfkit, que é quem vai desenhá-la.
  const opened = (document as unknown as { openImage(source: Buffer): { width: number, height: number } }).openImage(image)
  const scale = Math.max(width / opened.width, height / opened.height)
  const drawnWidth = opened.width * scale
  const drawnHeight = opened.height * scale

  document.image(image, (width - drawnWidth) / 2, (height - drawnHeight) / 2, { width: drawnWidth, height: drawnHeight })
}

function drawShape(document: PDFKit.PDFDocument, element: CertificateShape, palette: CertificatePalette) {
  const { x, y, width, height } = element
  const center = elementCenter(element)
  const hasFill = element.fill !== null && element.shape !== "line"
  const hasStroke = element.stroke !== null && element.stroke_width > 0

  if (!hasFill && !hasStroke) {
    return
  }

  if (element.shape === "line") {
    document.moveTo(x, center.y).lineTo(x + width, center.y)
  } else if (element.shape === "ellipse") {
    document.ellipse(center.x, center.y, width / 2, height / 2)
  } else if (element.radius > 0) {
    document.roundedRect(x, y, width, height, Math.min(element.radius, width / 2, height / 2))
  } else {
    document.rect(x, y, width, height)
  }

  if (hasFill && element.fill) {
    document.fillColor(paintFor(document, element.fill, palette, element))
  }

  if (hasStroke && element.stroke) {
    document.lineWidth(element.stroke_width).strokeColor(paintFor(document, element.stroke, palette, element))

    if (element.dash === "dashed") {
      document.dash(element.stroke_width * 3, { space: element.stroke_width * 2 })
    } else if (element.dash === "dotted") {
      document.lineCap("round").dash(0.01, { space: element.stroke_width * 2 })
    }
  }

  if (hasFill && hasStroke) {
    document.fillAndStroke()
  } else if (hasFill) {
    document.fill()
  } else {
    document.stroke()
  }
}

function drawText(
  document: PDFKit.PDFDocument,
  element: CertificateText,
  palette: CertificatePalette,
  fields: Record<string, string>,
  faces: Set<string>,
) {
  const layout = layoutText(element, fields)

  selectFace(document, layout.face, faces)
  document.fontSize(layout.size)

  for (const line of layout.lines) {
    if (line.text.length === 0) {
      continue
    }

    // A cor é aplicada a cada linha porque o sublinhado, desenhado como retângulo, também a usa.
    document.fillColor(paintFor(document, element.color, palette, element))
    document.text(line.text, line.x, line.baseline, {
      lineBreak: false,
      baseline: "alphabetic",
      characterSpacing: element.letter_spacing,
    })

    if (element.underline) {
      const thickness = Math.max(0.5, layout.size * 0.06)
      document.rect(line.x, line.baseline + layout.size * 0.12, line.width, thickness).fill()
    }
  }
}

export async function buildReceiptCertificate(receipt: CertificateReceipt, verificationUrl: string, options: CertificateOptions = {}) {
  const design = options.design ?? FACTORY_DESIGN
  const assets = options.assets ?? new Map<string, Buffer>()
  const fields = certificateFields(receipt, options.destination ?? null)
  const { palette } = design

  // O QR sai na cor que o desenho pede, sobre branco, que é o que a câmera precisa.
  const qrCodes = new Map<string, Buffer>()

  for (const element of design.elements) {
    if (element.type !== "qr") {
      continue
    }

    const color = resolveColor(element.color, palette)

    if (!qrCodes.has(color)) {
      qrCodes.set(color, await toBuffer(verificationUrl, { margin: 1, width: 360, color: { dark: color, light: "#FFFFFF" } }))
    }
  }

  const logo = loadLogo("color")

  return await renderPdf({ title: `Certificado ${receipt.number}`, landscape: true, margin: 0 }, (document) => {
    const width = document.page.width
    const height = document.page.height
    const faces = new Set<string>()

    document.rect(0, 0, width, height).fillColor(resolveColor(design.background.color, palette)).fill()

    const background = design.background.asset_id ? assets.get(design.background.asset_id) : undefined

    if (background) {
      document.save()
      document.opacity(design.background.opacity)
      drawCover(document, background, width, height)
      document.restore()
    }

    const draw = (element: CertificateElement) => {
      const center = elementCenter(element)

      document.save()

      // Cada elemento gira em torno do próprio centro, que é como o editor o mostra.
      if (element.rotation) {
        document.rotate(element.rotation, { origin: [center.x, center.y] })
      }

      if (element.opacity < 1) {
        document.opacity(element.opacity)
      }

      switch (element.type) {
        case "shape":
          drawShape(document, element, palette)
          break
        case "text":
          drawText(document, element, palette, fields, faces)
          break
        case "image": {
          const image = assets.get(element.asset_id)

          if (!image) break

          if (element.flip_x) document.transform(-1, 0, 0, 1, 2 * center.x, 0)
          if (element.flip_y) document.transform(1, 0, 0, -1, 0, 2 * center.y)

          document.image(image, element.x, element.y, { width: element.width, height: element.height })
          break
        }
        case "logo":
          if (logo) {
            document.image(logo, element.x, element.y, { width: element.width, height: element.height })
          }
          break
        case "qr": {
          const code = qrCodes.get(resolveColor(element.color, palette))
          const inset = element.width * 0.05

          document.roundedRect(element.x, element.y, element.width, element.height, element.width * 0.05).fillColor("#FFFFFF").fill()

          if (code) {
            document.image(code, element.x + inset, element.y + inset, { width: element.width - inset * 2, height: element.height - inset * 2 })
          }
          break
        }
      }

      document.restore()
    }

    design.elements.forEach(draw)

    // Tarja por cima de tudo, para não haver como confundir um documento estornado (ou uma prévia
    // do editor) com um válido, mas sem apagar o conteúdo, que continua legível por baixo.
    const stamp = receipt.status === "cancelled" ? "CANCELADO" : options.sample ? "MODELO" : null

    if (stamp) {
      document.save()
      document.rotate(-22, { origin: [width / 2, height / 2] })
      document.font("Helvetica-Bold").fontSize(96).fillColor("#B91C1C").fillOpacity(stamp === "MODELO" ? 0.08 : 0.13)
        .text(stamp, 0, height / 2 - 62, { width, align: "center", characterSpacing: 6, lineBreak: false })
      document.fillOpacity(1)
      document.restore()
    }
  })
}
