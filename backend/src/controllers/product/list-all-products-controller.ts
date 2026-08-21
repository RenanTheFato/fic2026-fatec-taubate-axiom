import { Request, Response } from "express";
import { z } from "zod/v4";
import { ListAllProductsService } from "../../services/product/list-all-products-service.js";
import { NotFoundError } from "../../config/errors.js";

export class ListAllProductsController {
  async handle(req: Request, res: Response) {
    const productQuery = z.object({
      page: z.coerce.number({ error: "The page must be an number" })
        .int({ error: "The page must be an integer" })
        .positive({ error: "The page number must be greater than zero" })
        .optional()
        .default(1),
      limit: z.coerce.number({ error: "The limit must be an number" })
        .int({ error: "The limit must be an integer" })
        .positive({ error: "The limit must be greater than zero" })
        .max(50, { error: "The limit has exceeded the maximum allowed limit (50)" })
        .optional()
        .default(50),
      search: z.string()
        .trim()
        .min(1, { error: "The search doesn't meet the minimum number of characters (1)" })
        .max(128, { error: "The search has exceeded the character limit (128)" })
        .optional(),
      active: z.boolean()
        .optional()
    })

    const parsedProductQuery = productQuery.safeParse(req.query)

    if (!parsedProductQuery.success) {
      const errors = parsedProductQuery.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { page, limit, search, active } = parsedProductQuery.data

    try {
      const listAllProductsService = new ListAllProductsService()
      const { products, total } = await listAllProductsService.execute({ page, limit, search, active })

      return res.status(200).json({ message: "All Products Fetched Successfully", products, total })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}