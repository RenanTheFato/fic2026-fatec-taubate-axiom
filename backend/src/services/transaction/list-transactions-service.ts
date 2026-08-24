import { Op, WhereOptions } from "sequelize";
import { InferAttributes } from "sequelize";
import { Campaign } from "../../models/campaign-model.js";
import { Donor } from "../../models/donor-model.js";
import { Event } from "../../models/event-model.js";
import { Transaction } from "../../models/transaction-model.js";
import { TransactionInterface } from "../../interfaces/transaction-interface.js";

interface ListTransactionsProps {
  page: number,
  limit: number,
  status?: TransactionInterface['status'],
  type?: TransactionInterface['type'],
  campaign_id?: TransactionInterface['campaign_id'],
  event_id?: TransactionInterface['event_id'],
  donor_id?: TransactionInterface['donor_id'],
  from?: Date,
  to?: Date,
}

export class ListTransactionsService {
  async execute({ page, limit, status, type, campaign_id, event_id, donor_id, from, to }: ListTransactionsProps) {

    const where: WhereOptions<InferAttributes<Transaction>> = {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(campaign_id ? { campaign_id } : {}),
      ...(event_id ? { event_id } : {}),
      ...(donor_id ? { donor_id } : {}),
      ...(from || to ? {
        created_at: {
          ...(from ? { [Op.gte]: from } : {}),
          ...(to ? { [Op.lte]: to } : {}),
        },
      } : {}),
    }

    const { rows: transactions, count: total } = await Transaction.findAndCountAll({
      where,
      include: [
        { model: Donor, as: "donor", attributes: ["id", "name", "email"] },
        { model: Campaign, as: "campaign", attributes: ["id", "title", "slug"] },
        { model: Event, as: "event", attributes: ["id", "title", "slug"] },
      ],
      // Mais recente primeiro é o que o painel financeiro precisa ver; o id no fim é o desempate
      // que impede a paginação de repetir ou pular registros entre páginas.
      order: [
        ["created_at", "DESC"],
        ["id", "ASC"],
      ],
      limit: limit,
      offset: (page - 1) * limit,
      distinct: true,
    })

    return { transactions, total }
  }
}
