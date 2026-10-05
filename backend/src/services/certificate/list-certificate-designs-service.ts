import { QueryTypes } from "sequelize";
import { sequelize } from "../../config/sequelize.js";
import { CertificateDesignInterface } from "../../interfaces/certificate-design-interface.js";
import { CertificateDesign, folderKey } from "../../models/certificate-design-model.js";
import type { CertificateScope } from "../../models/certificate-design-model.js";
import { User } from "../../models/user-model.js";
import { parseDesign } from "../../utils/certificate-design.js";

type IssuedRow = {
  certificate_design_id: string,
  issued: number,
}

// O histórico de uma pasta, da versão mais nova para a mais antiga. Cada versão vem com quem a
// gravou e quantos recibos nasceram com ela: é o que a equipe precisa para saber o que cada
// doador recebeu em cada época.
export class ListCertificateDesignsService {
  async execute({ scope, target_id }: { scope: CertificateScope, target_id: string | null }) {
    const folder = folderKey(scope, target_id)

    const designs = await CertificateDesign.findAll({
      where: { folder },
      include: [{ model: User, as: "author", attributes: ["id", "name"] }],
      order: [["version", "DESC"]],
    })

    const issued = designs.length > 0
      ? await sequelize.query<IssuedRow>(
        `SELECT certificate_design_id, COUNT(*) AS issued
           FROM receipts
          WHERE certificate_design_id IN (:ids)
          GROUP BY certificate_design_id`,
        { type: QueryTypes.SELECT, replacements: { ids: designs.map((design) => design.id) } }
      )
      : []

    const issuedById = new Map(issued.map((row) => [row.certificate_design_id, Number(row.issued)]))

    return designs.map((row) => {
      const plain = row.get({ plain: true }) as CertificateDesignInterface & { author?: { id: string, name: string } | null }

      return {
        ...plain,
        design: parseDesign(plain.design),
        author: plain.author ?? null,
        issued: issuedById.get(row.id) ?? 0,
      }
    })
  }
}
