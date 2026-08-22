import { Op, WhereOptions } from "sequelize";
import { NotFoundError } from "../../config/errors.js";
import { Product } from "../../models/product-model.js";
import { ProductInterface } from "../../interfaces/product-interface.js";

export class ListProductsService {
  async execute({ page, limit, search }: { page: number, limit: number, search?: string }) {
    const escapedSearch = search ? search.replace(/[\\%_]/g, (char) => `\\${char}`) : ""

    const where: WhereOptions<ProductInterface> = {
      active: true,
      ...(search ? {
        [Op.or]: [
          { name: { [Op.like]: `%${escapedSearch}%` } },
          { sku: { [Op.like]: `%${escapedSearch}%` } }
        ],
      } : {}),
    }

    const { rows: products, count: total } = await Product.findAndCountAll({
      where,
      order: [
        ["name", "ASC"],
        ["created_at", "DESC"],
        ["price", "ASC"],
        ["id", "ASC"],
      ],
      limit: limit,
      offset: (page - 1) * limit
    })

    if (!products) {
      throw new NotFoundError("Product Not Found")
    }

    return { products, total }
  }
}