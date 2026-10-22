import { Request, Response } from "express";
import { z } from "zod/v4";
import { NotFoundError } from "../../config/errors.js";
import { GenerateReceiptPdfService } from "../../services/receipt/generate-receipt-pdf-service.js";

export class DownloadReceiptCertificateController {
  async handle(req: Request, res: Response) {
    const { hash } = req.params as { hash: string }

    // A escolha de quem contribuiu: com o valor, com a mensagem no lugar dele, ou os dois.
    const certificateQuery = z.object({
      variant: z.enum(["amount", "message", "both"], { error: "The variant must be amount, message or both" })
        .optional()
        .default("amount"),
    })

    const parsedCertificateQuery = certificateQuery.safeParse(req.query)

    if (!parsedCertificateQuery.success) {
      const errors = parsedCertificateQuery.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { variant } = parsedCertificateQuery.data

    try {
      const generateReceiptPdfService = new GenerateReceiptPdfService()
      const { pdf, filename } = await generateReceiptPdfService.execute({ hash, format: "certificate", variant })

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
