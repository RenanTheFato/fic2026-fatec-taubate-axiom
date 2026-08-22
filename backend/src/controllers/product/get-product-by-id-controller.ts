import { Request, Response } from "express";
import { z } from "zod/v4";
import { GetProductByIdService } from "../../services/product/get-product-by-id-service.js";
import { NotFoundError } from "../../config/errors.js";

export class GetProductByIdController {
  async handle(req: Request, res: Response) {
    const getProductParam = z.object({
      id: z.string({ error: "The id must be an string" })
    })

    const parsedGetProductParam = getProductParam.safeParse(req.params)

    if (!parsedGetProductParam.success) {
      const errors = parsedGetProductParam.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { id } = parsedGetProductParam.data

    try {
      const getProductByIdService = new GetProductByIdService()
      const product = await getProductByIdService.execute({ id })

      return res.status(200).json({ message: "Product Founded", product })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}