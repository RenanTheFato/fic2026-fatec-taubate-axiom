import { Op, WhereOptions, InferAttributes, fn, col, literal } from "sequelize";
import { Transaction, TransactionType } from "../../models/transaction-model.js";
import { TransactionItem } from "../../models/transaction-item-model.js";
import { TransactionItemInterface } from "../../interfaces/transaction-item-interface.js";

interface SummarizeTransactionItemsProps {
  product_id?: TransactionItemInterface['product_id'],
  type?: TransactionType,
  from?: Date,
  to?: Date,
}

interface SummaryLine {
  product_id: string | null,
  description: string,
  quantity: string,
  revenue: string | null,
  transactions: string,
}

function aggregates() {
  return {
    quantity: fn("SUM", col("TransactionItem.quantity")),
    revenue: fn("SUM", literal("`TransactionItem`.`quantity` * `TransactionItem`.`unit_price`")),
    transactions: fn("COUNT", fn("DISTINCT", col("TransactionItem.transaction_id"))),
  }
}

export class SummarizeTransactionItemsService {
  async execute({ product_id, type, from, to }: SummarizeTransactionItemsProps) {

    const where: WhereOptions<InferAttributes<TransactionItem>> = {
      ...(product_id ? { product_id } : {}),
    }
    const transactionWhere: WhereOptions<InferAttributes<Transaction>> = {
      status: "confirmed",
      ...(type ? { type } : {}),
      ...(from || to ? {
        confirmed_at: {
          ...(from ? { [Op.gte]: from } : {}),
          ...(to ? { [Op.lte]: to } : {}),
        },
      } : {}),
    }

    const confirmedOnly = {
      model: Transaction,
      as: "transaction",
      attributes: [],
      where: transactionWhere,
      required: true,
    }

    const grouped = aggregates()

    const lines = await TransactionItem.findAll({
      where,
      attributes: [
        "product_id",
        "description",
        [grouped.quantity, "quantity"],
        [grouped.revenue, "revenue"],
        [grouped.transactions, "transactions"],
      ],
      include: [confirmedOnly],
      group: ["TransactionItem.product_id", "TransactionItem.description"],
      order: [
        [literal("revenue"), "DESC"],
        [literal("quantity"), "DESC"],
      ],
      raw: true,
    }) as unknown as SummaryLine[]

    const overall = aggregates()

    const [totals] = await TransactionItem.findAll({
      where,
      attributes: [
        [overall.quantity, "quantity"],
        [overall.revenue, "revenue"],
        [overall.transactions, "transactions"],
      ],
      include: [confirmedOnly],
      raw: true,
    }) as unknown as SummaryLine[]

    return {
      summary: lines.map((line) => ({
        product_id: line.product_id,
        description: line.description,
        quantity: Number(line.quantity),
        revenue: line.revenue ?? "0.00",
        transactions: Number(line.transactions),
      })),
      totals: {
        products: lines.length,
        quantity: Number(totals?.quantity ?? 0),
        revenue: totals?.revenue ?? "0.00",
        transactions: Number(totals?.transactions ?? 0),
      },
    }
  }
}
