import { QueryTypes } from "sequelize";
import { sequelize } from "../../config/sequelize.js";
import { CertificateDesignInterface } from "../../interfaces/certificate-design-interface.js";
import { CertificateDesign, folderKey } from "../../models/certificate-design-model.js";
import type { CertificateScope, CertificateVariant } from "../../models/certificate-design-model.js";
import { User } from "../../models/user-model.js";
import { parseDesign } from "../../utils/certificate-design.js";

type IssuedRow = {
  certificate_design_id: string,
  issued: number,
}

// O histórico de uma variação da pasta, da versão mais nova para a mais antiga. Cada versão vem com quem a
// gravou e quantos recibos nasceram com ela: é o que a equipe precisa para saber o que cada
// doador recebeu em cada época.
export class ListCertificateDesignsService {
  async execute({ scope, target_id, variant }: { scope: CertificateScope, target_id: string | null, variant: CertificateVariant }) {
    const folder = folderKey(scope, target_id)

    const designs = await CertificateDesign.findAll({
      where: { folder, variant },
      include: [{ model: User, as: "author", attributes: ["id", "name"] }],
      order: [["version", "DESC"]],
    })

    // O recibo guarda as duas versões em colunas próprias; a da variação decide qual contar. O nome
    // da coluna sai de um enum validado, nunca do texto da requisição.
    const column = variant === "amount" ? "certificate_design_id" : "certificate_message_design_id"

    const issued = designs.length > 0
      ? await sequelize.query<IssuedRow>(
        `SELECT ${column} AS certificate_design_id, COUNT(*) AS issued
           FROM receipts
          WHERE ${column} IN (:ids)
          GROUP BY ${column}`,
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
