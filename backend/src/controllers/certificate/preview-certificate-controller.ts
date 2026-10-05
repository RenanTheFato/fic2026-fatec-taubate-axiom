import { Request, Response } from "express";
import { z } from "zod/v4";
import { CERTIFICATE_SCOPES } from "../../models/certificate-design-model.js";
import { TRANSACTION_TYPES } from "../../models/transaction-model.js";
import { PreviewCertificateService } from "../../services/certificate/preview-certificate-service.js";
import { certificateDesignSchema } from "../../utils/certificate-design.js";

export class PreviewCertificateController {
  async handle(req: Request, res: Response) {
    const previewValidate = z.object({
      scope: z.enum(CERTIFICATE_SCOPES, { error: "The scope must be default, campaign or event" }),
      target_id: z.uuid({ error: "The target id must be a valid uuid" })
        .nullish()
        .default(null),
      transaction_type: z.enum(TRANSACTION_TYPES, { error: "The transaction type must be donation, sponsorship, ticket or product" })
        .optional()
        .default("donation"),
      design: certificateDesignSchema(),
    })

    const parsedPreview = previewValidate.safeParse(req.body)

    if (!parsedPreview.success) {
      const errors = parsedPreview.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { scope, target_id, transaction_type, design } = parsedPreview.data

    try {
      const previewCertificateService = new PreviewCertificateService()
      const pdf = await previewCertificateService.execute({ design, scope, target_id, transaction_type })

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="modelo-de-certificado.pdf"`,
        "Content-Length": String(pdf.length),
      })

      return res.status(200).send(pdf)
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
