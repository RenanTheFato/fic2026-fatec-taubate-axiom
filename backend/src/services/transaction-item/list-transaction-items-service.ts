import { Op, WhereOptions, InferAttributes } from "sequelize";
import { Product } from "../../models/product-model.js";
import { Transaction } from "../../models/transaction-model.js";
import { TransactionItem } from "../../models/transaction-item-model.js";
import { TransactionItemInterface } from "../../interfaces/transaction-item-interface.js";

interface ListTransactionItemsProps {
  page: number,
  limit: number,
  transaction_id?: TransactionItemInterface['transaction_id'],
  product_id?: TransactionItemInterface['product_id'],
  from?: Date,
  to?: Date,
}

export class ListTransactionItemsService {
  async execute({ page, limit, transaction_id, product_id, from, to }: ListTransactionItemsProps) {

    const where: WhereOptions<InferAttributes<TransactionItem>> = {
      ...(transaction_id ? { transaction_id } : {}),
      ...(product_id ? { product_id } : {}),
      ...(from || to ? {
        created_at: {
          ...(from ? { [Op.gte]: from } : {}),
          ...(to ? { [Op.lte]: to } : {}),
        },
      } : {}),
    }

    const { rows: items, count: total } = await TransactionItem.findAndCountAll({
      where,
      include: [
        { model: Transaction, as: "transaction", attributes: ["id", "type", "status", "amount", "confirmed_at"] },
        { model: Product, as: "product", attributes: ["id", "name", "sku", "active"] },
      ],
      order: [
        ["created_at", "DESC"],
        ["id", "ASC"],
      ],
      limit: limit,
      offset: (page - 1) * limit,
      distinct: true,
    })

    return { items, total }
  }
}
