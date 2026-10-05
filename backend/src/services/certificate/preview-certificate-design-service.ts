import { NotFoundError } from "../../config/errors.js";
import { CertificateDesign } from "../../models/certificate-design-model.js";
import type { TransactionType } from "../../models/transaction-model.js";
import { parseDesign } from "../../utils/certificate-design.js";
import { PreviewCertificateService } from "./preview-certificate-service.js";

// A prévia de uma versão já gravada: é como a equipe abre "o certificado de Natal do ano passado"
// sem precisar de um recibo de verdade daquela época.
export class PreviewCertificateDesignService {
  async execute({ id, transaction_type }: { id: string, transaction_type: TransactionType }) {
    const saved = await CertificateDesign.findByPk(id)

    if (!saved) {
      throw new NotFoundError("Certificate Design Not Found")
    }

    const pdf = await new PreviewCertificateService().execute({
      design: parseDesign(saved.design),
      scope: saved.scope,
      target_id: saved.campaign_id ?? saved.event_id,
      transaction_type,
    })

    return { pdf, filename: `modelo-${saved.folder.replace(":", "-")}-v${saved.version}.pdf` }
  }
}
