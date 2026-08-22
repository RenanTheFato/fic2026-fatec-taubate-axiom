import { Op } from "sequelize";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { ProductInterface } from "../../interfaces/product-interface.js";
import { Product } from "../../models/product-model.js";

interface UpdateProductProps {
  id: ProductInterface['id'],
  name?: ProductInterface['name'],
  sku?: ProductInterface['sku'],
  description?: ProductInterface['description'],
  price?: ProductInterface['price'],
  image_url?: ProductInterface['image_url'],
}

export class UpdateProductService {
  async execute({ id, name, sku, description, price, image_url }: UpdateProductProps) {
    const product = await Product.findByPk(id)

    if (!product) {
      throw new NotFoundError("Product Not Found")
    }

    const normalizedSku = sku !== undefined && sku !== null ? sku.trim().toUpperCase() : sku

    if (normalizedSku) {
      const verifySkuInUse = await Product.findOne({
        where: {
          sku: normalizedSku,
          id: { [Op.ne]: id }
        }
      })

      if (verifySkuInUse) {
        throw new BadRequestError("A product with this SKU already exists")
      }
    }

    await product.update({
      ...(name !== undefined ? { name } : {}),
      ...(sku !== undefined ? { sku: normalizedSku } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(image_url !== undefined ? { image_url } : {}),
    })

    return product.get({ plain: true })
  }
}