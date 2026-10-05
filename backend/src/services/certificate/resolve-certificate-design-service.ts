import { Transaction as DatabaseTransaction } from "sequelize";
import { CertificateDesign, folderKey } from "../../models/certificate-design-model.js";

interface ResolveCertificateDesignProps {
  campaign_id: string | null,
  event_id: string | null,
  database_transaction?: DatabaseTransaction,
}

// Qual versão de certificado um recibo recebe ao nascer: a mais recente da pasta mais específica
// que tiver alguma. Evento antes de campanha, campanha antes do modelo padrão. Sem nenhuma, o
// recibo fica com NULL e sai no modelo de fábrica.
export class ResolveCertificateDesignService {
  async execute({ campaign_id, event_id, database_transaction }: ResolveCertificateDesignProps) {
    const priority = [
      ...(event_id ? [folderKey("event", event_id)] : []),
      ...(campaign_id ? [folderKey("campaign", campaign_id)] : []),
      folderKey("default", null),
    ]

    const candidates = await CertificateDesign.findAll({
      where: { folder: priority },
      attributes: ["id", "folder", "version"],
      order: [["version", "DESC"]],
      transaction: database_transaction,
    })

    for (const folder of priority) {
      const latest = candidates.find((candidate) => candidate.folder === folder)

      if (latest) {
        return latest.id
      }
    }

    return null
  }
}
