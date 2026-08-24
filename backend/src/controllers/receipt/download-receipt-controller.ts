import { Request, Response } from "express";
import { NotFoundError } from "../../config/errors.js";
import { GenerateReceiptPdfService } from "../../services/receipt/generate-receipt-pdf-service.js";

export class DownloadReceiptController {
  async handle(req: Request, res: Response) {
    const { hash } = req.params as { hash: string }

    try {
      const generateReceiptPdfService = new GenerateReceiptPdfService()
      const { pdf, filename } = await generateReceiptPdfService.execute({ hash, format: "document" })

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": String(pdf.length),
      })

      return res.status(200).send(pdf)
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
