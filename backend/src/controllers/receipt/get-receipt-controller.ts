import { Request, Response } from "express";
import { NotFoundError } from "../../config/errors.js";
import { GetReceiptService } from "../../services/receipt/get-receipt-service.js";

export class GetReceiptController {
  async handle(req: Request, res: Response) {
    const { id } = req.params as { id: string }

    try {
      const getReceiptService = new GetReceiptService()
      const receipt = await getReceiptService.execute({ id })

      return res.status(200).json({ message: "Receipt Fetched Successfully", receipt })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
