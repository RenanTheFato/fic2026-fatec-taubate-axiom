import { env } from "../../config/env.js";
import { Campaign } from "../../models/campaign-model.js";
import type { CertificateScope } from "../../models/certificate-design-model.js";
import { Event } from "../../models/event-model.js";
import type { TransactionType } from "../../models/transaction-model.js";
import type { CertificateDesignSpec } from "../../utils/certificate-design.js";
import { buildReceiptCertificate } from "../../utils/receipt-certificate-template.js";
import { destinationPhrase } from "../../utils/receipt-labels.js";
import { LoadCertificateAssetsService } from "./load-certificate-assets-service.js";

interface PreviewCertificateProps {
  design: CertificateDesignSpec,
  scope: CertificateScope,
  target_id: string | null,
  transaction_type: TransactionType,
}

// A prévia é o mesmo template do certificado de verdade, com dados de exemplo e a tarja "MODELO".
// Mesmo desenho, mesmo código: é a garantia de que o que a equipe aprova no editor é o que o
// doador recebe, sem uma segunda implementação que poderia divergir.
export class PreviewCertificateService {
  async execute({ design, scope, target_id, transaction_type }: PreviewCertificateProps) {
    const assets = await new LoadCertificateAssetsService().execute({ design })

    const campaign = scope === "campaign" && target_id ? await Campaign.findByPk(target_id, { attributes: ["title"] }) : null
    const event = scope === "event" && target_id ? await Event.findByPk(target_id, { attributes: ["title"] }) : null

    const sample = {
      number: `${new Date().getUTCFullYear()}/000123`,
      sequence: 123,
      status: "issued" as const,
      donor_name: "Maria Aparecida Oliveira",
      amount: transaction_type === "sponsorship" ? "5000.00" : "150.00",
      transaction_type,
      issued_at: new Date(),
      // O mesmo código de exemplo que o editor desenha, para a linha do registro ter a mesma largura.
      hash: "5f3a9c1e7b2d4f8a6c0e9b3d1f7a5c2e8b4d6f0a3c9e1b7d5f2a8c4e6b0d9f3a",
    }

    return await buildReceiptCertificate(sample, `${env.WEB_URL}/certificado/${sample.hash}`, {
      design,
      assets,
      destination: destinationPhrase({ event: event?.title, campaign: campaign?.title }),
      sample: true,
    })
  }
}
