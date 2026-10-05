import { randomBytes } from "node:crypto";
import { QueryTypes } from "sequelize";
import { sequelize } from "../../config/sequelize.js";

export interface SupporterScope {
  campaign_id?: string | null,
  event_id?: string | null,
}

interface ListSupportersProps {
  scope: SupporterScope,
  seed: string | null,
  page: number,
  limit: number,
}

type NameRow = { name: string }
type CountRow = { listed: number, contributors: number }

// O mural de quem apoiou. Três regras sustentam esta consulta, e nenhuma é detalhe:
//
// 1. **A ordem é aleatória e nunca passa por dinheiro.** O valor doado não é lido, não é somado e
//    não sai na resposta, nem como desempate: o mural agradece pessoas, e ordenar por quantia
//    transformaria agradecimento em ranking, constrangendo quem deu o que podia.
// 2. **Aleatória, mas paginável.** A ordem é o hash de uma semente com o id do doador: a mesma
//    semente devolve sempre a mesma ordem, então a página 2 continua a página 1 sem repetir nem
//    pular nomes, e cada visita nova (semente nova) embaralha o mural inteiro de novo.
// 3. **Nome só com consentimento.** Entra quem tem ao menos uma contribuição confirmada no recorte
//    com `public_recognition` marcado, e o doador anonimizado nunca entra. Estornada não conta,
//    porque o dinheiro voltou. A contagem de quem apoiou sem pedir para aparecer vai separada, só
//    como número.
export class ListSupportersService {
  async execute({ scope, seed, page, limit }: ListSupportersProps) {
    const order = seed ?? randomBytes(6).toString("hex")

    const filters: string[] = ["t.status = 'confirmed'"]
    const replacements: Record<string, string | number> = { seed: order, limit, offset: (page - 1) * limit }

    if (scope.event_id) {
      filters.push("t.event_id = :event_id")
      replacements.event_id = scope.event_id
    }

    // A campanha reúne o que veio direto para ela e o que veio pelos eventos que a sustentam.
    if (scope.campaign_id) {
      filters.push("(t.campaign_id = :campaign_id OR t.event_id IN (SELECT e.id FROM events e WHERE e.campaign_id = :campaign_id))")
      replacements.campaign_id = scope.campaign_id
    }

    const where = filters.join(" AND ")

    const [names, counts] = await Promise.all([
      sequelize.query<NameRow>(
        `SELECT d.name
           FROM donors d
          WHERE d.anonymized_at IS NULL
            AND EXISTS (SELECT 1 FROM transactions t WHERE t.donor_id = d.id AND t.public_recognition = 1 AND ${where})
          ORDER BY SHA2(CONCAT(:seed, d.id), 256)
          LIMIT :limit OFFSET :offset`,
        { type: QueryTypes.SELECT, replacements }
      ),
      sequelize.query<CountRow>(
        `SELECT COUNT(DISTINCT CASE WHEN t.public_recognition = 1 AND d.anonymized_at IS NULL THEN d.id END) AS listed,
                COUNT(DISTINCT d.id) AS contributors
           FROM transactions t
           JOIN donors d ON d.id = t.donor_id
          WHERE ${where}`,
        { type: QueryTypes.SELECT, replacements }
      ),
    ])

    return {
      supporters: names.map((row) => ({ name: row.name })),
      total: Number(counts[0]?.listed ?? 0),
      contributors: Number(counts[0]?.contributors ?? 0),
      seed: order,
    }
  }
}
