import { Op } from "sequelize";
import { CertificateDesign, folderKey } from "../../models/certificate-design-model.js";
import type { CertificateScope } from "../../models/certificate-design-model.js";
import { Receipt } from "../../models/receipt-model.js";

interface ListIssuedCertificatesProps {
  scope: CertificateScope,
  target_id: string | null,
  design_id: string | null,
  page: number,
  limit: number,
}

// Os certificados que já saíram de uma pasta, para a equipe abrir o documento que cada doador
// recebeu. Traz nome de doador, então responde só a quem já lida com recibo.
export class ListIssuedCertificatesService {
  async execute({ scope, target_id, design_id, page, limit }: ListIssuedCertificatesProps) {
    const folder = folderKey(scope, target_id)

    const designs = await CertificateDesign.findAll({
      where: { folder, ...(design_id ? { id: design_id } : {}) },
      attributes: ["id", "version", "label"],
    })

    if (designs.length === 0) {
      return { certificates: [], total: 0 }
    }

    const byId = new Map(designs.map((design) => [design.id, design]))

    const { rows, count } = await Receipt.findAndCountAll({
      where: { certificate_design_id: { [Op.in]: [...byId.keys()] } },
      attributes: ["id", "number", "sequence", "donor_name", "amount", "transaction_type", "status", "issued_at", "hash", "certificate_design_id"],
      order: [["sequence", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    })

    return {
      certificates: rows.map((receipt) => {
        const design = byId.get(receipt.certificate_design_id as string)

        return {
          ...receipt.get({ plain: true }),
          design_version: design?.version ?? null,
          design_label: design?.label ?? null,
        }
      }),
      total: count,
    }
  }
}
