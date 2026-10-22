import { toString } from "qrcode";
import { NotFoundError } from "../../config/errors.js";
import { env } from "../../config/env.js";
import { ReceiptInterface } from "../../interfaces/receipt-interface.js";
import { Receipt } from "../../models/receipt-model.js";
import { certificateFields } from "../../utils/certificate-fields.js";
import type { CertificateDesignSpec } from "../../utils/certificate-design.js";
import { resolveColor } from "../../utils/certificate-layout.js";
import { LoadReceiptCertificateService } from "../certificate/load-receipt-certificate-service.js";
import { VerifyReceiptService } from "./verify-receipt-service.js";

// A segunda via do certificado: o que o site precisa para desenhar na tela, sem PDF, o certificado
// de quem perdeu o arquivo. Vão os dois desenhos com que o recibo nasceu (o que mostra o valor e o
// que leva a mensagem no lugar dele, para a pessoa escolher), os campos já escritos como o PDF os
// escreve e o QR pronto, além do veredito da corrente, para a página dizer se o documento vale.
// O documento do doador não vai: o hash é a credencial, e o certificado é a peça que circula.
export class ViewReceiptCertificateService {
  async execute({ hash }: { hash: ReceiptInterface['hash'] }) {

    const receipt = await Receipt.findOne({ where: { hash } })

    if (!receipt) {
      throw new NotFoundError("Receipt Not Found")
    }

    const data = receipt.get({ plain: true })
    const { authentic, valid } = await new VerifyReceiptService().execute({ hash })
    const { variants, destination } = await new LoadReceiptCertificateService().execute({ receipt: data })

    // O QR de cada variação sai na cor que o desenho dela pede.
    async function qrFor(design: CertificateDesignSpec) {
      const qr = design.elements.find((element) => element.type === "qr")
      const svg = await toString(`${env.WEB_URL}/certificado/${data.hash}`, {
        type: "svg",
        margin: 1,
        color: { dark: qr ? resolveColor(qr.color, design.palette) : "#1C1917", light: "#FFFFFF" },
      })

      return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
    }

    return {
      number: data.number,
      status: data.status,
      transaction_type: data.transaction_type,
      issued_at: data.issued_at,
      cancelled_at: data.cancelled_at,
      hash: data.hash,
      authentic,
      valid,
      variants: {
        amount: { ...variants.amount, qr: await qrFor(variants.amount.design) },
        message: { ...variants.message, qr: await qrFor(variants.message.design) },
      },
      fields: certificateFields(data, destination),
    }
  }
}
