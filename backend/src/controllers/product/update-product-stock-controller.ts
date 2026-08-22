import { Request, Response } from "express";
import { z } from "zod/v4";
import { ProductInterface } from "../../interfaces/product-interface.js";
import { UpdateProductStockService } from "../../services/product/update-product-stock-service.js";
import { BadRequestError, NotFoundError } from "../../config/errors.js";

export class UpdateProductStockController {
  async handle(req: Request, res: Response) {
    const { id } = req.params as Pick<ProductInterface, 'id'>

    const stockValidate = z.object({
      stock: z.number({ error: "The stock must be a number." })
        .int({ error: "The stock must be an integer." })
        .min(0, { error: "The stock can't be negative." })
        .max(4294967295, { error: "The stock has exceeded the allowed limit (4294967295)." }),
    })

    const parsedStock = stockValidate.safeParse(req.body)

    if (!parsedStock.success) {
      const errors = parsedStock.error.issues.map((err) => ({
        code: err.code,
        message: err.message,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { stock } = parsedStock.data

    try {
      const updateProductStockService = new UpdateProductStockService()
      const product = await updateProductStockService.execute({ id, stock })

      return res.status(200).json({ message: "Product Stock Updated", product })
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
