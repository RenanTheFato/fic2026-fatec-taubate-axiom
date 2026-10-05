import { ReceiptInterface } from "../../interfaces/receipt-interface.js";
import { Campaign } from "../../models/campaign-model.js";
import { CertificateDesign } from "../../models/certificate-design-model.js";
import { Event } from "../../models/event-model.js";
import { Transaction } from "../../models/transaction-model.js";
import { FACTORY_DESIGN } from "../../utils/certificate-classic.js";
import { parseDesign } from "../../utils/certificate-design.js";
import { destinationPhrase } from "../../utils/receipt-labels.js";

// O que um certificado já emitido precisa para ser desenhado de novo: a versão de design com que o
// recibo nasceu (ou o modelo de fábrica, se ele nasceu antes de qualquer personalização) e o
// destino da transação. É o mesmo para o PDF e para a página pública de segunda via, e é por isso
// que um certificado de Natal emitido no ano passado sai hoje igual nos dois.
export class LoadReceiptCertificateService {
  async execute({ receipt }: { receipt: Pick<ReceiptInterface, "certificate_design_id" | "transaction_id"> }) {
    const saved = receipt.certificate_design_id
      ? await CertificateDesign.findByPk(receipt.certificate_design_id, { attributes: ["design", "version", "label"] })
      : null

    const transaction = await Transaction.findByPk(receipt.transaction_id, {
      attributes: ["id"],
      include: [
        { model: Campaign, as: "campaign", attributes: ["title"] },
        { model: Event, as: "event", attributes: ["title"] },
      ],
    })

    const related = transaction as (Transaction & { campaign?: Campaign | null, event?: Event | null }) | null

    return {
      design: saved ? parseDesign(saved.design) : FACTORY_DESIGN,
      version: saved ? { version: saved.version, label: saved.label } : null,
      destination: destinationPhrase({ event: related?.event?.title, campaign: related?.campaign?.title }),
    }
  }
}
