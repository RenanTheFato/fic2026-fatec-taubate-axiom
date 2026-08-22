import { NotFoundError } from "../../config/errors.js";
import { ProductInterface } from "../../interfaces/product-interface.js";
import { Product } from "../../models/product-model.js";

interface UpdateProductStockProps {
  id: ProductInterface['id'],
  stock: ProductInterface['stock'],
}

export class UpdateProductStockService {
  async execute({ id, stock }: UpdateProductStockProps) {
    const product = await Product.findByPk(id)

    if (!product) {
      throw new NotFoundError("Product Not Found")
    }

    await product.update({ stock })

    return product.get({ plain: true })
  }
}
