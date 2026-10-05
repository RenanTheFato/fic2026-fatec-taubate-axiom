import { UniqueConstraintError } from "sequelize";
import { BadRequestError } from "../../config/errors.js";
import { sequelize } from "../../config/sequelize.js";
import { CertificateDesignInterface } from "../../interfaces/certificate-design-interface.js";
import { Campaign } from "../../models/campaign-model.js";
import { CertificateAsset } from "../../models/certificate-asset-model.js";
import { CertificateDesign, folderKey } from "../../models/certificate-design-model.js";
import { Event } from "../../models/event-model.js";
import { referencedAssets } from "../../utils/certificate-design.js";

interface CreateCertificateDesignProps {
  scope: CertificateDesignInterface['scope'],
  target_id: string | null,
  label: CertificateDesignInterface['label'],
  design: CertificateDesignInterface['design'],
  created_by: CertificateDesignInterface['created_by'],
}

// Salvar nunca sobrescreve: cada gravação é a versão seguinte da pasta. A anterior continua
// existindo, e todo recibo emitido com ela continua saindo exatamente como saiu.
export class CreateCertificateDesignService {
  async execute({ scope, target_id, label, design, created_by }: CreateCertificateDesignProps) {

    if (scope === "default" && target_id) {
      throw new BadRequestError("The default design doesn't belong to a campaign or an event")
    }

    if (scope !== "default" && !target_id) {
      throw new BadRequestError("A campaign or event design requires the target id")
    }

    if (scope === "campaign" && !(await Campaign.findByPk(target_id as string))) {
      throw new BadRequestError("The informed campaign doesn't exist")
    }

    if (scope === "event" && !(await Event.findByPk(target_id as string))) {
      throw new BadRequestError("The informed event doesn't exist")
    }

    const assets = referencedAssets(design)

    if (assets.length > 0) {
      const found = await CertificateAsset.count({ where: { id: assets } })

      if (found !== assets.length) {
        throw new BadRequestError("The design references an image that doesn't exist")
      }
    }

    const folder = folderKey(scope, target_id)

    try {
      const created = await sequelize.transaction(async (t) => {
        // A próxima versão é lida e gravada na mesma transação. Se duas pessoas salvarem a mesma
        // pasta ao mesmo tempo, o índice único (folder, version) recusa a segunda em vez de deixar
        // duas versões com o mesmo número.
        const latest = await CertificateDesign.max<number, CertificateDesign>("version", { where: { folder }, transaction: t })

        return await CertificateDesign.create({
          scope,
          campaign_id: scope === "campaign" ? target_id : null,
          event_id: scope === "event" ? target_id : null,
          folder,
          version: (latest ?? 0) + 1,
          label,
          design,
          created_by,
        }, { transaction: t })
      })

      return created.get({ plain: true })
    } catch (error: unknown) {
      if (error instanceof UniqueConstraintError) {
        throw new BadRequestError("Another version of this certificate was saved at the same time. Reload and try again")
      }

      throw error
    }
  }
}
