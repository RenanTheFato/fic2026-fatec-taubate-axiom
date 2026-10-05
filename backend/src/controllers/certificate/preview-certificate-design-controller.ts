import { Request, Response } from "express";
import { z } from "zod/v4";
import { NotFoundError } from "../../config/errors.js";
import { TRANSACTION_TYPES } from "../../models/transaction-model.js";
import { PreviewCertificateDesignService } from "../../services/certificate/preview-certificate-design-service.js";

export class PreviewCertificateDesignController {
  async handle(req: Request, res: Response) {
    const previewParams = z.object({
      id: z.uuid({ error: "The id must be a valid uuid" }),
      transaction_type: z.enum(TRANSACTION_TYPES, { error: "The transaction type must be donation, sponsorship, ticket or product" })
        .optional()
        .default("donation"),
    })

    const parsedPreview = previewParams.safeParse({ ...req.query, id: req.params.id })

    if (!parsedPreview.success) {
      const errors = parsedPreview.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { id, transaction_type } = parsedPreview.data

    try {
      const previewCertificateDesignService = new PreviewCertificateDesignService()
      const { pdf, filename } = await previewCertificateDesignService.execute({ id, transaction_type })

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
