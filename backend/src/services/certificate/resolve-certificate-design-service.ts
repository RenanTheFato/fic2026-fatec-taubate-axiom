import { Transaction as DatabaseTransaction } from "sequelize";
import { CertificateDesign, CERTIFICATE_VARIANTS, folderKey } from "../../models/certificate-design-model.js";
import type { CertificateVariant } from "../../models/certificate-design-model.js";

interface ResolveCertificateDesignProps {
  campaign_id: string | null,
  event_id: string | null,
  database_transaction?: DatabaseTransaction,
}

// Quais versões de certificado um recibo recebe ao nascer, uma por variação: a mais recente da
// pasta mais específica que tiver alguma daquela variação. Evento antes de campanha, campanha antes
// do modelo padrão. Sem nenhuma, a variação fica com NULL e sai no modelo de fábrica. As duas são
// decididas separadamente: uma campanha pode personalizar só o certificado com valor e herdar a
// mensagem do modelo padrão.
export class ResolveCertificateDesignService {
  async execute({ campaign_id, event_id, database_transaction }: ResolveCertificateDesignProps) {
    const priority = [
      ...(event_id ? [folderKey("event", event_id)] : []),
      ...(campaign_id ? [folderKey("campaign", campaign_id)] : []),
      folderKey("default", null),
    ]

    const candidates = await CertificateDesign.findAll({
      where: { folder: priority },
      attributes: ["id", "folder", "variant", "version"],
      order: [["version", "DESC"]],
      transaction: database_transaction,
    })

    function latestOf(variant: CertificateVariant) {
      for (const folder of priority) {
        const latest = candidates.find((candidate) => candidate.folder === folder && candidate.variant === variant)

        if (latest) {
          return latest.id
        }
      }

      return null
    }

    const [amount, message] = CERTIFICATE_VARIANTS.map(latestOf)

    return { amount, message }
  }
}
