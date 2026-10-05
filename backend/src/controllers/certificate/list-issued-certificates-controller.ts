import { Request, Response } from "express";
import { z } from "zod/v4";
import { CERTIFICATE_SCOPES } from "../../models/certificate-design-model.js";
import { ListIssuedCertificatesService } from "../../services/certificate/list-issued-certificates-service.js";

export class ListIssuedCertificatesController {
  async handle(req: Request, res: Response) {
    const issuedQuery = z.object({
      scope: z.enum(CERTIFICATE_SCOPES, { error: "The scope must be default, campaign or event" }),
      target_id: z.uuid({ error: "The target id must be a valid uuid" })
        .nullish()
        .default(null),
      design_id: z.uuid({ error: "The design id must be a valid uuid" })
        .nullish()
        .default(null),
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
        .default(20),
    })

    const parsedIssuedQuery = issuedQuery.safeParse(req.query)

    if (!parsedIssuedQuery.success) {
      const errors = parsedIssuedQuery.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { scope, target_id, design_id, page, limit } = parsedIssuedQuery.data

    try {
      const listIssuedCertificatesService = new ListIssuedCertificatesService()
      const { certificates, total } = await listIssuedCertificatesService.execute({ scope, target_id, design_id, page, limit })

      return res.status(200).json({ message: "Issued Certificates Fetched Successfully", certificates, total })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
