import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError } from "../../config/errors.js";
import { CreateProductService } from "../../services/product/create-product-service.js";

export class CreateProductController {
  async handle(req: Request, res: Response) {
    const productValidate = z.object({
      name: z.string()
        .min(2, { error: "The name doesn't meet the minimum number of characters (2)." })
        .max(128, { error: "The name has exceeded the character limit (128)." }),
      sku: z.string()
        .min(2, { error: "The SKU doesn't meet the minimum number of characters (2)." })
        .max(64, { error: "The SKU has exceeded the character limit (64)." })
        .nullish()
        .default(null),
      description: z.string()
        .max(2048, { error: "The description has exceeded the character limit (2048)." })
        .nullish()
        .default(null),
      price: z.number({ error: "The price must be a number." })
        .positive({ error: "The price must be greater than zero." })
        .multipleOf(0.01, { error: "The price must have at most two decimal places." })
        .max(99999999.99, { error: "The price has exceeded the allowed limit (99999999.99)." })
        .transform((price) => price.toFixed(2)),
      stock: z.number({ error: "The stock must be a number." })
        .int({ error: "The stock must be an integer." })
        .min(0, { error: "The stock can't be negative." })
        .max(4294967295, { error: "The stock has exceeded the allowed limit (4294967295)." })
        .optional()
        .default(0),
      image_url: z.url({ error: "The image url isn't a valid url." })
        .max(255, { error: "The image url has exceeded the character limit (255)." })
        .nullish()
        .default(null),
    })

    const parsedProduct = productValidate.safeParse(req.body)

    if (!parsedProduct.success) {
      const errors = parsedProduct.error.issues.map((err) => ({
        code: err.code,
        message: err.message,
        path: err.path.join("/")
      }))

      return res.status(400).json({ message: "Validation Error Occurred", errors })
    }

    const { name, sku, description, price, stock, image_url } = parsedProduct.data

    try {
      const createProductService = new CreateProductService()
      const product = await createProductService.execute({ name, sku, description, price, stock, image_url })
      return res.status(201).json({ message: "Product Created Successfully", product })
    } catch (error: unknown) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).send({ error: "Internal Server Error" })
    }
  }
}
