import { toBuffer } from "qrcode";
import { organization } from "../config/organization.js";
import { ReceiptInterface } from "../interfaces/receipt-interface.js";
import { formatDate, formatMoney, loadLogo, renderPdf } from "./pdf-document.js";
import { CERTIFICATE_DEED_BY_TYPE, CERTIFICATE_TITLE_BY_TYPE } from "./receipt-labels.js";

// Certificado: paisagem, colorido, feito para o doador guardar, imprimir e mostrar. Carrega os
// mesmos dados do recibo institucional e o mesmo QR de verificação: muda a roupa, não o conteúdo.
// O documento do doador **não** aparece aqui de propósito: é a peça que circula.

const PAPER = "#FDFCF8"
const DEEP = "#064E3B"
const ACCENT = "#059669"
const GOLD = "#B98A2E"
const INK = "#1C1917"
const MUTED = "#78716C"
const HAIRLINE = "#E7E2D6"

function diamond(document: PDFKit.PDFDocument, x: number, y: number, radius: number) {
  document.moveTo(x, y - radius).lineTo(x + radius, y).lineTo(x, y + radius).lineTo(x - radius, y).closePath()
}

export async function buildReceiptCertificate(receipt: ReceiptInterface, verificationUrl: string) {
  const qrCode = await toBuffer(verificationUrl, { margin: 1, width: 320, color: { dark: DEEP, light: "#FFFFFF" } })
  const logo = loadLogo("color")

  return await renderPdf({ title: `Certificado ${receipt.number}`, landscape: true, margin: 0 }, (document) => {
    const width = document.page.width
    const height = document.page.height
    const center = width / 2

    // Papel e moldura

    document.rect(0, 0, width, height).fillColor(PAPER).fill()

    const frameGradient = document.linearGradient(24, 24, width - 24, height - 24)
    frameGradient.stop(0, DEEP)
    frameGradient.stop(0.5, ACCENT)
    frameGradient.stop(1, GOLD)

    document.roundedRect(24, 24, width - 48, height - 48, 8).lineWidth(2.5).strokeColor(frameGradient).stroke()
    document.roundedRect(34, 34, width - 68, height - 68, 5).lineWidth(0.6).strokeColor(HAIRLINE).stroke()

    const corners: [number, number][] = [[34, 34], [width - 34, 34], [34, height - 34], [width - 34, height - 34]]
    corners.forEach(([x, y]) => {
      diamond(document, x, y, 6)
      document.fillColor(GOLD).fill()
    })

    // Cabeçalho

    if (logo) {
      document.image(logo, center - 26, 48, { fit: [52, 52] })
    }

    document.font("Helvetica").fontSize(9).fillColor(MUTED)
      .text(organization.name.toUpperCase(), 0, logo ? 112 : 70, { width, align: "center", characterSpacing: 3 })

    const titleTop = logo ? 136 : 96
    const titleGradient = document.linearGradient(center - 210, titleTop, center + 210, titleTop + 34)
    titleGradient.stop(0, DEEP)
    titleGradient.stop(1, ACCENT)

    document.font("Helvetica-Bold").fontSize(30).fillColor(titleGradient)
      .text(CERTIFICATE_TITLE_BY_TYPE[receipt.transaction_type], 0, titleTop, { width, align: "center" })

    // Ornamento separador

    const ornamentY = titleTop + 48
    document.moveTo(center - 110, ornamentY).lineTo(center - 14, ornamentY).lineWidth(0.8).strokeColor(GOLD).stroke()
    document.moveTo(center + 14, ornamentY).lineTo(center + 110, ornamentY).lineWidth(0.8).strokeColor(GOLD).stroke()
    diamond(document, center, ornamentY, 5)
    document.fillColor(GOLD).fill()

    // Corpo

    document.font("Helvetica").fontSize(10.5).fillColor(MUTED)
      .text("Este certificado reconhece que", 0, ornamentY + 18, { width, align: "center" })

    // O nome é o único campo de tamanho imprevisível da página: uma razão social longa tem cinco
    // vezes o comprimento de um nome de pessoa. A fonte encolhe até caber numa linha, e o que vem
    // depois é posicionado a partir da altura medida, não de um `y` fixo que o nome atropelaria.
    const nameWidth = width - 160
    const nameTop = ornamentY + 42
    let nameSize = 24

    while (nameSize > 15 && document.font("Helvetica-Bold").fontSize(nameSize).widthOfString(receipt.donor_name) > nameWidth) {
      nameSize -= 1
    }

    document.font("Helvetica-Bold").fontSize(nameSize)
    const nameHeight = document.heightOfString(receipt.donor_name, { width: nameWidth, align: "center" })

    document.fillColor(INK)
      .text(receipt.donor_name, center - nameWidth / 2, nameTop, { width: nameWidth, align: "center" })

    const afterName = nameTop + nameHeight

    document.font("Helvetica").fontSize(11.5).fillColor(INK).text(
      CERTIFICATE_DEED_BY_TYPE[receipt.transaction_type],
      center - 280, afterName + 12, { width: 560, align: "center", lineGap: 2 }
    )

    // Valor em destaque

    const pillTop = afterName + 40
    const pillGradient = document.linearGradient(center - 130, pillTop, center + 130, pillTop + 48)
    pillGradient.stop(0, DEEP)
    pillGradient.stop(1, ACCENT)

    document.roundedRect(center - 130, pillTop, 260, 48, 24).fillColor(pillGradient).fill()
    document.font("Helvetica-Bold").fontSize(21).fillColor("#FFFFFF")
      .text(formatMoney(receipt.amount), center - 130, pillTop + 15, { width: 260, align: "center" })

    document.font("Helvetica").fontSize(10).fillColor(MUTED).text(
      `destinada às atividades da ${organization.name}.`,
      center - 260, pillTop + 62, { width: 520, align: "center" }
    )

    // Rodapé em três colunas

    const footerTop = height - 190

    document.moveTo(70, footerTop).lineTo(width - 70, footerTop).lineWidth(0.6).strokeColor(HAIRLINE).stroke()

    document.font("Helvetica").fontSize(7).fillColor(GOLD)
      .text("RECIBO Nº", 70, footerTop + 22, { width: 200, characterSpacing: 1.2 })
    document.font("Helvetica-Bold").fontSize(12).fillColor(INK)
      .text(receipt.number, 70, footerTop + 34, { width: 200 })

    document.font("Helvetica").fontSize(7).fillColor(GOLD)
      .text("EMITIDO EM", 70, footerTop + 60, { width: 200, characterSpacing: 1.2 })
    document.font("Helvetica").fontSize(10).fillColor(INK)
      .text(formatDate(receipt.issued_at), 70, footerTop + 72, { width: 200 })

    document.image(qrCode, center - 34, footerTop + 18, { fit: [68, 68] })
    document.font("Helvetica").fontSize(7).fillColor(MUTED)
      .text("VERIFIQUE A AUTENTICIDADE", center - 100, footerTop + 92, { width: 200, align: "center", characterSpacing: 0.8 })

    const signatureLeft = width - 290
    document.moveTo(signatureLeft, footerTop + 66).lineTo(signatureLeft + 220, footerTop + 66)
      .lineWidth(0.8).strokeColor(INK).stroke()
    document.font("Helvetica-Bold").fontSize(9.5).fillColor(INK)
      .text(organization.name, signatureLeft, footerTop + 74, { width: 220, align: "center" })
    document.font("Helvetica").fontSize(7.5).fillColor(MUTED)
      .text(`CNPJ ${organization.document}`, signatureLeft, footerTop + 88, { width: 220, align: "center" })

    // A corrente também vai impressa aqui: o certificado é verificável do mesmo jeito que o recibo.
    // A URL não entra: ela já está no QR, e a linha só cabe em uma. `lineBreak: false` é trava:
    // texto que quebrasse aqui passaria da margem inferior e o pdfkit abriria uma segunda página.
    document.font("Courier").fontSize(6.5).fillColor(MUTED)
      .text(`registro #${receipt.sequence}  ·  ${receipt.hash}`,
        60, height - 62, { width: width - 120, align: "center", lineBreak: false })

    // Tarja de cancelamento por cima de tudo, para não haver como confundir um documento estornado
    // com um válido, mas sem apagar o conteúdo, que continua sendo o que foi assinado.
    if (receipt.status === "cancelled") {
      document.save()
      document.rotate(-22, { origin: [center, height / 2] })
      document.font("Helvetica-Bold").fontSize(96).fillColor("#B91C1C").fillOpacity(0.13)
        .text("CANCELADO", 0, height / 2 - 62, { width, align: "center", characterSpacing: 6 })
      document.fillOpacity(1)
      document.restore()
    }
  })
}
