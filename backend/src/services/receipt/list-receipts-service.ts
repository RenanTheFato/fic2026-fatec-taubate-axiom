import { Op, WhereOptions, InferAttributes } from "sequelize";
import { Receipt } from "../../models/receipt-model.js";
import { Transaction } from "../../models/transaction-model.js";
import { ReceiptInterface } from "../../interfaces/receipt-interface.js";

interface ListReceiptsProps {
  page: number,
  limit: number,
  status?: ReceiptInterface['status'],
  transaction_type?: ReceiptInterface['transaction_type'],
  from?: Date,
  to?: Date,
}

export class ListReceiptsService {
  async execute({ page, limit, status, transaction_type, from, to }: ListReceiptsProps) {

    const where: WhereOptions<InferAttributes<Receipt>> = {
      ...(status ? { status } : {}),
      ...(transaction_type ? { transaction_type } : {}),
      ...(from || to ? {
        issued_at: {
          ...(from ? { [Op.gte]: from } : {}),
          ...(to ? { [Op.lte]: to } : {}),
        },
      } : {}),
    }

    const { rows: receipts, count: total } = await Receipt.findAndCountAll({
      where,
      include: [
        { model: Transaction, as: "transaction", attributes: ["id", "type", "status", "campaign_id", "event_id"] },
      ],
      order: [["sequence", "DESC"]],
      limit: limit,
      offset: (page - 1) * limit,
      distinct: true,
    })

    return { receipts, total }
  }
}
