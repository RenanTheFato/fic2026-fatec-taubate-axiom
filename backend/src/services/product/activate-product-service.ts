import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { ProductInterface } from "../../interfaces/product-interface.js";
import { Product } from "../../models/product-model.js";

export class ActivateProductService {
  async execute({ id }: Pick<ProductInterface, 'id'>) {
    const product = await Product.findByPk(id)

    if (!product) {
      throw new NotFoundError("Product not found")
    }

    if (product.active === true) {
      throw new BadRequestError("The product is already active")
    }

    if (Number(product.price) <= 0) {
      throw new BadRequestError("Cannot be possible to activate a product with a price of zero or lower")
    }

    await product.update({
      active: true
    })
  }
}