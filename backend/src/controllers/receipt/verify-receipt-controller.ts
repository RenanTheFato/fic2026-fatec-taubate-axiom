import { Request, Response } from "express";
import { NotFoundError } from "../../config/errors.js";
import { VerifyReceiptService } from "../../services/receipt/verify-receipt-service.js";

export class VerifyReceiptController {
  async handle(req: Request, res: Response) {
    const { hash } = req.params as { hash: string }

    try {
      const verifyReceiptService = new VerifyReceiptService()
      const verification = await verifyReceiptService.execute({ hash })

      return res.status(200).json({ message: "Receipt Verified Successfully", ...verification })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
