import { Request, Response } from "express";
import { ProductInterface } from "../../interfaces/product-interface.js";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { DeactivateProductService } from "../../services/product/deactivate-product-service.js";

export class DeactivateProductController {
  async handle(req: Request, res: Response) {
    const { id } = req.params as Pick<ProductInterface, 'id'>

    try {
      const deactivateProductService = new DeactivateProductService()
      await deactivateProductService.execute({ id })

      return res.status(200).json({ message: "Product is now deactivated" })
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