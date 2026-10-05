import { Request, Response } from "express";
import { NotFoundError } from "../../config/errors.js";
import { ViewReceiptCertificateService } from "../../services/receipt/view-receipt-certificate-service.js";

export class ViewReceiptCertificateController {
  async handle(req: Request, res: Response) {
    const { hash } = req.params as { hash: string }

    try {
      const viewReceiptCertificateService = new ViewReceiptCertificateService()
      const certificate = await viewReceiptCertificateService.execute({ hash: hash.trim().toLowerCase() })

      return res.status(200).json({ message: "Certificate Fetched Successfully", certificate })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
