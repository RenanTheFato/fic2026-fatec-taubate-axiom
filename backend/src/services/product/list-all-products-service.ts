import { Op, WhereOptions } from "sequelize"
import { Product } from "../../models/product-model.js"
import { ProductInterface } from "../../interfaces/product-interface.js"
import { NotFoundError } from "../../config/errors.js"

export class ListAllProductsService {
  async execute({ page, limit, search, active }: { page: number, limit: number, search?: string, active?: boolean }) {
    const escapedSearch = search ? search.replace(/[\\%_]/g, (char) => `\\${char}`) : ""

    const where: WhereOptions<ProductInterface> | undefined = search
      ? {
        [Op.or]: [
          { name: { [Op.like]: `%${escapedSearch}%` } },
          { sku: { [Op.like]: `%${escapedSearch}%` } }
        ],
      } : undefined

    const { rows: products, count: total } = await Product.findAndCountAll({
      where: {
        ...(typeof active === 'boolean' ? { active } : {}),
        ...(where ? where : {}),
      },
      order: [
        ["name", "ASC"],
      ],
      limit: limit,
      offset: (page - 1) * limit
    })

    if (!products) {
      throw new NotFoundError("Product not found")
    }

    return { products, total }
  }
}