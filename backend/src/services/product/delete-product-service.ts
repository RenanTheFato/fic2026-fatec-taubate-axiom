import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { ProductInterface } from "../../interfaces/product-interface.js";
import { Product } from "../../models/product-model.js";

export class DeleteProductService {
  async execute({ id }: Pick<ProductInterface, 'id'>) {
    const product = await Product.findByPk(id)

    if (!product) {
      throw new NotFoundError("Product Not Found")
    }

    if (product.activated_at !== null) {
      throw new BadRequestError("Cannot be possible to delete a product that has already been activated")
    }

    await Product.destroy({
      where: {
        id
      }
    })
  }
}
