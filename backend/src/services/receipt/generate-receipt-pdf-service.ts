import { NotFoundError } from "../../config/errors.js";
import { env } from "../../config/env.js";
import { ReceiptInterface } from "../../interfaces/receipt-interface.js";
import { Receipt } from "../../models/receipt-model.js";
import { buildReceiptDocument } from "../../utils/receipt-document-template.js";
import { buildReceiptCertificate } from "../../utils/receipt-certificate-template.js";
import { LoadCertificateAssetsService } from "../certificate/load-certificate-assets-service.js";
import { LoadReceiptCertificateService } from "../certificate/load-receipt-certificate-service.js";

export type ReceiptPdfFormat = "document" | "certificate"

// O que o doador escolhe na segunda via: o certificado com o valor, o que leva a mensagem no lugar
// dele, ou os dois no mesmo arquivo, um por página.
export type CertificateChoice = "amount" | "message" | "both"

interface GenerateReceiptPdfProps {
  hash: ReceiptInterface['hash'],
  format: ReceiptPdfFormat,
  variant?: CertificateChoice,
}

// O service lê o recibo, monta o endereço de verificação e entrega o desenho ao template. O QR do
// recibo institucional aponta para a conferência da API; o do certificado, que é a peça que o
// doador mostra, aponta para a página de segunda via do site, onde quem lê o QR vê o certificado.
export class GenerateReceiptPdfService {
  async execute({ hash, format, variant = "amount" }: GenerateReceiptPdfProps) {

    const receipt = await Receipt.findOne({ where: { hash } })

    if (!receipt) {
      throw new NotFoundError("Receipt Not Found")
    }

    const data = receipt.get({ plain: true })

    const pdf = format === "certificate"
      ? await this.certificate(data, variant)
      : await buildReceiptDocument(data, `${env.APP_URL}/api/v1/receipt/verify/${data.hash}`)

    const prefix = format === "document" ? "recibo" : variant === "message" ? "certificado-mensagem" : "certificado"

    return { receipt: data, pdf, filename: `${prefix}-${data.number.replace("/", "-")}.pdf`}
  }

  private async certificate(receipt: ReceiptInterface, variant: CertificateChoice) {
    const { variants, destination } = await new LoadReceiptCertificateService().execute({ receipt })

    const designs = variant === "both"
      ? [variants.amount.design, variants.message.design]
      : [variants[variant].design]

    const assets = new Map<string, Buffer>()

    for (const design of designs) {
      for (const [id, data] of await new LoadCertificateAssetsService().execute({ design })) {
        assets.set(id, data)
      }
    }

    return await buildReceiptCertificate(receipt, `${env.WEB_URL}/certificado/${receipt.hash}`, { designs, assets, destination })
  }
}
