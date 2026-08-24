import { toBuffer } from "qrcode";
import { organization } from "../config/organization.js";
import { ReceiptInterface } from "../interfaces/receipt-interface.js";
import { formatDocument } from "./format-document.js";
import { formatDateTime, formatMoney, loadLogo, renderPdf } from "./pdf-document.js";
import { RECEIPT_SUBJECT_BY_TYPE, RECEIPT_TITLE_BY_TYPE } from "./receipt-labels.js";

// Recibo institucional: preto e branco, sóbrio, feito para ser impresso, arquivado e anexado a uma
// prestação de contas. Toda a cor foi tirada de propósito — este é o documento que vai para o
// contador, não o que o doador posta.

const INK = "#111111"
const MUTED = "#6B6B6B"
const LINE = "#CFCFCF"
const SURFACE = "#F4F4F5"

export async function buildReceiptDocument(receipt: ReceiptInterface, verificationUrl: string) {
  const qrCode = await toBuffer(verificationUrl, { margin: 1, width: 320, color: { dark: "#111111", light: "#FFFFFF" } })
  const logo = loadLogo("mono")
  const donorDocument = formatDocument(receipt.donor_document)

  return await renderPdf({ title: `Recibo ${receipt.number}` }, (document) => {
    const left = document.page.margins.left
    const width = document.page.width - document.page.margins.left - document.page.margins.right

    // Cabeçalho institucional

    if (logo) {
      document.image(logo, left, 50, { fit: [44, 44] })
    }

    const headerLeft = logo ? left + 58 : left

    document.font("Helvetica-Bold").fontSize(15).fillColor(INK)
      .text(organization.name, headerLeft, 56, { width: width - (headerLeft - left) })
    document.font("Helvetica").fontSize(8.5).fillColor(MUTED)
      .text(`CNPJ ${organization.document}  ·  ${organization.email}  ·  ${organization.city}`,
        headerLeft, 77, { width: width - (headerLeft - left) })

    document.moveTo(left, 112).lineTo(left + width, 112).lineWidth(1).strokeColor(INK).stroke()

    // Título e identificação do documento

    document.font("Helvetica-Bold").fontSize(19).fillColor(INK)
      .text(RECEIPT_TITLE_BY_TYPE[receipt.transaction_type], left, 132, { characterSpacing: 0.4 })

    document.font("Helvetica").fontSize(9.5).fillColor(MUTED)
      .text(`Nº ${receipt.number}   ·   Emitido em ${formatDateTime(receipt.issued_at)}`, left, 158, { width })

    const cancelled = receipt.status === "cancelled"

    if (cancelled) {
      document.rect(left, 182, width, 26).fillColor(SURFACE).fill()
      document.rect(left, 182, 3, 26).fillColor(INK).fill()
      document.font("Helvetica-Bold").fontSize(10).fillColor(INK)
        .text(`DOCUMENTO CANCELADO — transação estornada${receipt.cancelled_at ? ` em ${formatDateTime(receipt.cancelled_at)}` : ""}`,
          left + 14, 189, { width: width - 28 })
    }

    const bodyTop = cancelled ? 230 : 196

    // Valor

    document.rect(left, bodyTop, width, 62).fillColor(SURFACE).fill()
    document.rect(left, bodyTop, 3, 62).fillColor(INK).fill()
    document.font("Helvetica").fontSize(8.5).fillColor(MUTED)
      .text("VALOR RECEBIDO", left + 16, bodyTop + 13, { characterSpacing: 1 })
    document.font("Helvetica-Bold").fontSize(23).fillColor(INK)
      .text(formatMoney(receipt.amount), left + 16, bodyTop + 27)

    // Declaração

    const declarationTop = bodyTop + 90

    const declaration = `Recebemos de ${receipt.donor_name}`
      + `${donorDocument ? `, portador(a) do documento ${donorDocument},` : ""} `
      + `a importância de ${formatMoney(receipt.amount)} `
      + `referente a ${RECEIPT_SUBJECT_BY_TYPE[receipt.transaction_type]} destinada às atividades da `
      + `${organization.name}, pelo que firmamos o presente recibo.`

    document.font("Helvetica").fontSize(11)

    // A declaração é o único bloco de altura variável do recibo: uma razão social longa acrescenta
    // linha. O que vem depois parte da altura medida, senão o texto atropela a tabela de dados.
    const declarationHeight = document.heightOfString(declaration, { width, align: "justify", lineGap: 3 })

    document.fillColor(INK).text(declaration, left, declarationTop, { width, align: "justify", lineGap: 3 })

    // Dados do documento

    const detailsTop = declarationTop + declarationHeight + 34

    document.moveTo(left, detailsTop - 18).lineTo(left + width, detailsTop - 18)
      .lineWidth(0.8).strokeColor(LINE).stroke()

    const details: [string, string][] = [
      ["Doador", receipt.donor_name],
      ["Documento", donorDocument ?? "Não informado"],
      ["Transação", receipt.transaction_id],
      ["Posição na cadeia", `#${receipt.sequence}`],
    ]

    details.forEach(([label, value], index) => {
      const row = detailsTop + index * 20
      document.font("Helvetica").fontSize(9).fillColor(MUTED).text(label, left, row, { width: 140 })
      document.font("Helvetica").fontSize(9).fillColor(INK).text(value, left + 140, row, { width: width - 140 })
    })

    // Verificação pública

    const verifyTop = detailsTop + details.length * 20 + 26

    document.rect(left, verifyTop, width, 148).lineWidth(0.8).strokeColor(LINE).stroke()
    document.image(qrCode, left + 18, verifyTop + 20, { fit: [106, 106] })

    const columnLeft = left + 146
    const columnWidth = width - 164

    document.font("Helvetica-Bold").fontSize(10.5).fillColor(INK)
      .text("Verificação pública", columnLeft, verifyTop + 18, { width: columnWidth })
    document.font("Helvetica").fontSize(8.5).fillColor(MUTED).text(
      "Este recibo integra uma cadeia de registros encadeados por hash. Aponte a câmera para o "
      + "código ou acesse o endereço abaixo para conferir, sem login, se o documento é autêntico.",
      columnLeft, verifyTop + 35, { width: columnWidth, lineGap: 2 }
    )

    document.font("Helvetica").fontSize(8).fillColor(INK)
      .text(verificationUrl, columnLeft, verifyTop + 76, { width: columnWidth })

    document.font("Helvetica").fontSize(6.5).fillColor(MUTED)
      .text("HASH DESTE RECIBO", columnLeft, verifyTop + 98, { characterSpacing: 0.8 })
    document.font("Courier").fontSize(7).fillColor(INK)
      .text(receipt.hash, columnLeft, verifyTop + 108, { width: columnWidth })

    document.font("Helvetica").fontSize(6.5).fillColor(MUTED)
      .text("HASH DO RECIBO ANTERIOR", columnLeft, verifyTop + 122, { characterSpacing: 0.8 })
    document.font("Courier").fontSize(7).fillColor(INK)
      .text(receipt.previous_hash ?? "primeiro registro da cadeia", columnLeft, verifyTop + 132, { width: columnWidth })
  })
}
