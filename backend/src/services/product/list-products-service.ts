import { NotFoundError } from "../../config/errors.js";
import { Product } from "../../models/product-model.js";

export class ListProductsService {
  async execute({ page, limit, search }: { page: number, limit: number, search?: string }) {

    const escapedSearch = search ? search.replace(/[\\%_]/g, (char) => `\\${char}`) : ""

    const { rows: products, count: total } = await Product.findAndCountAll({
      where: {
        name: escapedSearch,
        active: true
      },
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