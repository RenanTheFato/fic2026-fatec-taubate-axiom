import { Request, Response } from "express";
import { ProductInterface } from "../../interfaces/product-interface.js";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { DeleteProductService } from "../../services/product/delete-product-service.js";

export class DeleteProductController {
  async handle(req: Request, res: Response) {
    const { id } = req.params as Pick<ProductInterface, 'id'>

    try {
      const deleteProductService = new DeleteProductService()
      await deleteProductService.execute({ id })

      return res.status(204).json()
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
