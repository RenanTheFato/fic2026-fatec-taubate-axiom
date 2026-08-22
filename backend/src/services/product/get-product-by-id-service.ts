import { NotFoundError } from "../../config/errors.js";
import { ProductInterface } from "../../interfaces/product-interface.js";
import { Product } from "../../models/product-model.js";

export class GetProductByIdService {
  async execute({ id }: Pick<ProductInterface, 'id'>) {
    const product = await Product.findByPk(id)

    if (!product) {
      throw new NotFoundError("Product not found")
    }

    return product.get({ plain: true })
  }
}