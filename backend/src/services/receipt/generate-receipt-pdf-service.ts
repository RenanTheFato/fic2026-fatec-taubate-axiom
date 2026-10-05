import { NotFoundError } from "../../config/errors.js";
import { env } from "../../config/env.js";
import { ReceiptInterface } from "../../interfaces/receipt-interface.js";
import { Receipt } from "../../models/receipt-model.js";
import { buildReceiptDocument } from "../../utils/receipt-document-template.js";
import { buildReceiptCertificate } from "../../utils/receipt-certificate-template.js";
import { LoadCertificateAssetsService } from "../certificate/load-certificate-assets-service.js";
import { LoadReceiptCertificateService } from "../certificate/load-receipt-certificate-service.js";

export type ReceiptPdfFormat = "document" | "certificate"

interface GenerateReceiptPdfProps {
  hash: ReceiptInterface['hash'],
  format: ReceiptPdfFormat,
}

// O service lê o recibo, monta o endereço de verificação e entrega o desenho ao template. O QR do
// recibo institucional aponta para a conferência da API; o do certificado, que é a peça que o
// doador mostra, aponta para a página de segunda via do site, onde quem lê o QR vê o certificado.
export class GenerateReceiptPdfService {
  async execute({ hash, format }: GenerateReceiptPdfProps) {

    const receipt = await Receipt.findOne({ where: { hash } })

    if (!receipt) {
      throw new NotFoundError("Receipt Not Found")
    }

    const data = receipt.get({ plain: true })

    const pdf = format === "certificate"
      ? await this.certificate(data)
      : await buildReceiptDocument(data, `${env.APP_URL}/api/v1/receipt/verify/${data.hash}`)

    const prefix = format === "certificate" ? "certificado" : "recibo"

    return { receipt: data, pdf, filename: `${prefix}-${data.number.replace("/", "-")}.pdf`}
  }

  private async certificate(receipt: ReceiptInterface) {
    const { design, destination } = await new LoadReceiptCertificateService().execute({ receipt })
    const assets = await new LoadCertificateAssetsService().execute({ design })

    return await buildReceiptCertificate(receipt, `${env.WEB_URL}/certificado/${receipt.hash}`, { design, assets, destination })
  }
}
