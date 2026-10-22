import { ReceiptInterface } from "../../interfaces/receipt-interface.js";
import { Campaign } from "../../models/campaign-model.js";
import { CertificateDesign } from "../../models/certificate-design-model.js";
import type { CertificateVariant } from "../../models/certificate-design-model.js";
import { Event } from "../../models/event-model.js";
import { Transaction } from "../../models/transaction-model.js";
import { factoryDesign } from "../../utils/certificate-classic.js";
import { parseDesign } from "../../utils/certificate-design.js";
import type { CertificateDesignSpec } from "../../utils/certificate-design.js";
import { destinationPhrase } from "../../utils/receipt-labels.js";

type LoadedVariant = {
  design: CertificateDesignSpec,
  version: { version: number, label: string } | null,
}

// O que um certificado já emitido precisa para ser desenhado de novo: as duas versões com que o
// recibo nasceu, a que mostra o valor e a que leva a mensagem (ou o modelo de fábrica de cada uma,
// se ele nasceu antes de qualquer personalização), e o destino da transação. É o mesmo para o PDF e
// para a página pública de segunda via, e é por isso que um certificado de Natal emitido no ano
// passado sai hoje igual nos dois.
export class LoadReceiptCertificateService {
  async execute({ receipt }: { receipt: Pick<ReceiptInterface, "certificate_design_id" | "certificate_message_design_id" | "transaction_id"> }) {
    const ids = [receipt.certificate_design_id, receipt.certificate_message_design_id].filter((id): id is string => Boolean(id))

    const saved = ids.length > 0
      ? await CertificateDesign.findAll({ where: { id: ids }, attributes: ["id", "design", "version", "label"] })
      : []

    const transaction = await Transaction.findByPk(receipt.transaction_id, {
      attributes: ["id"],
      include: [
        { model: Campaign, as: "campaign", attributes: ["title"] },
        { model: Event, as: "event", attributes: ["title"] },
      ],
    })

    const related = transaction as (Transaction & { campaign?: Campaign | null, event?: Event | null }) | null

    function load(variant: CertificateVariant, id: string | null): LoadedVariant {
      const row = id ? saved.find((design) => design.id === id) : undefined

      return row
        ? { design: parseDesign(row.design), version: { version: row.version, label: row.label } }
        : { design: factoryDesign(variant), version: null }
    }

    return {
      variants: {
        amount: load("amount", receipt.certificate_design_id),
        message: load("message", receipt.certificate_message_design_id),
      },
      destination: destinationPhrase({ event: related?.event?.title, campaign: related?.campaign?.title }),
    }
  }
}
