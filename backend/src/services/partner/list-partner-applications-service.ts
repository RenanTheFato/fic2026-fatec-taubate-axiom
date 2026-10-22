import { Partner } from "../../models/partner-model.js";
import type { PartnerStatus } from "../../models/partner-model.js";
import { User } from "../../models/user-model.js";

interface ListPartnerApplicationsProps {
  status: PartnerStatus | null,
  page: number,
  limit: number,
}

// Os pedidos de parceria para a associação analisar. Os parceiros que já estavam na rede antes da
// plataforma também aparecem, como aprovados e sem conta, porque são a mesma rede.
export class ListPartnerApplicationsService {
  async execute({ status, page, limit }: ListPartnerApplicationsProps) {

    const { rows, count: total } = await Partner.findAndCountAll({
      where: status ? { status } : {},
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        { model: User, as: "reviewer", attributes: ["id", "name"] },
      ],
      order: [["created_at", "DESC"], ["id", "ASC"]],
      limit,
      offset: (page - 1) * limit,
    })

    // A contagem da aba "em análise" não depende do filtro da página.
    const pending = await Partner.count({ where: { status: "pending" } })

    return { partners: rows.map((row) => row.get({ plain: true })), total, pending }
  }
}
