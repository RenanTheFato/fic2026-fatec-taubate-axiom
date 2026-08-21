import { BadRequestError } from "../../config/errors.js";
import { ProductInterface } from "../../interfaces/product-interface.js";
import { Product } from "../../models/product-model.js";

export class CreateProductService {
  async execute({ name, sku, description, price, stock, image_url }: Pick<ProductInterface, 'name' | 'sku' | 'description' | 'price' | 'stock' | 'image_url'>) {
    const normalizedSku = sku ? sku.trim().toUpperCase() : null

    if (normalizedSku) {
      const verifySkuInUse = await Product.findOne({
        where: {
          sku: normalizedSku
        }
      })

      if (verifySkuInUse) {
        throw new BadRequestError("A product with this SKU already exists")
      }
    }

    const product = await Product.create({
      name,
      sku: normalizedSku,
      description,
      price,
      stock,
      image_url,
      active: false
    })

    return product.get({ plain: true })
  }
}
