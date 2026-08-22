import { Request, Response } from "express";
import { z } from "zod/v4";
import { ProductInterface } from "../../interfaces/product-interface.js";
import { UpdateProductService } from "../../services/product/update-product-service.js";
import { BadRequestError, NotFoundError } from "../../config/errors.js";

export class UpdateProductController {
  async handle(req: Request, res: Response) {
    const { id } = req.params as Pick<ProductInterface, 'id'>

    const updateProductValidate = z.object({
      name: z.string()
        .min(2, { error: "The name doesn't meet the minimum number of characters (2)." })
        .max(128, { error: "The name has exceeded the character limit (128)." })
        .optional(),
      sku: z.string()
        .min(2, { error: "The SKU doesn't meet the minimum number of characters (2)." })
        .max(64, { error: "The SKU has exceeded the character limit (64)." })
        .nullish(),
      description: z.string()
        .max(2048, { error: "The description has exceeded the character limit (2048)." })
        .nullish(),
      price: z.number({ error: "The price must be a number." })
        .positive({ error: "The price must be greater than zero." })
        .multipleOf(0.01, { error: "The price must have at most two decimal places." })
        .max(99999999.99, { error: "The price has exceeded the allowed limit (99999999.99)." })
        .transform((price) => price.toFixed(2))
        .optional(),
      image_url: z.url({ error: "The image url isn't a valid url." })
        .max(255, { error: "The image url has exceeded the character limit (255)." })
        .nullish()
    }).refine((product) => Object.keys(product).length > 0, {
      error: "At least one field must be provided to update the product.",
    })

    const parsedUpdateProductValidate = updateProductValidate.safeParse(req.body)

    if (!parsedUpdateProductValidate.success) {
      const errors = parsedUpdateProductValidate.error.issues.map((err) => ({
        code: err.code,
        message: err.message,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { name, sku, description, price, image_url} = parsedUpdateProductValidate.data

    try {
      const updateProductService = new UpdateProductService()
      const product = await updateProductService.execute({ id, name, sku, description, price, image_url })

      return res.status(200).json({ message: "Product Updated", product })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}