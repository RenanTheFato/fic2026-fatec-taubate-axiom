import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { ProductInterface } from "../../interfaces/product-interface.js";
import { Product } from "../../models/product-model.js";

export class DeactivateProductService {
  async execute({ id }: Pick<ProductInterface, 'id'>) {
    const product = await Product.findByPk(id)

    if (!product) {
      throw new NotFoundError("Product not found")
    }

    if (product.active === false) {
      throw new BadRequestError("The product is already deactivated")
    }

    await product.update({
      active: false
    })
  }
}