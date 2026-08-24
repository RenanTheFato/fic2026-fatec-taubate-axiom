import { NotFoundError } from "../../config/errors.js";
import { env } from "../../config/env.js";
import { ReceiptInterface } from "../../interfaces/receipt-interface.js";
import { Receipt } from "../../models/receipt-model.js";
import { buildReceiptDocument } from "../../utils/receipt-document-template.js";
import { buildReceiptCertificate } from "../../utils/receipt-certificate-template.js";

export type ReceiptPdfFormat = "document" | "certificate"

interface GenerateReceiptPdfProps {
  hash: ReceiptInterface['hash'],
  format: ReceiptPdfFormat,
}

//  service lê o recibo, monta o endereço público de verificação e entrega o desenho ao template.
export class GenerateReceiptPdfService {
  async execute({ hash, format }: GenerateReceiptPdfProps) {

    const receipt = await Receipt.findOne({ where: { hash } })

    if (!receipt) {
      throw new NotFoundError("Receipt Not Found")
    }

    const data = receipt.get({ plain: true })
    const verificationUrl = `${env.APP_URL}/api/v1/receipt/verify/${data.hash}`

    const pdf = format === "certificate" ? await buildReceiptCertificate(data, verificationUrl) : await buildReceiptDocument(data, verificationUrl)

    const prefix = format === "certificate" ? "certificado" : "recibo"

    return { receipt: data, pdf, filename: `${prefix}-${data.number.replace("/", "-")}.pdf`}
  }
}
