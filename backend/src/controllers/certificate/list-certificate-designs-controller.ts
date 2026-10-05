import { Request, Response } from "express";
import { z } from "zod/v4";
import { CERTIFICATE_SCOPES } from "../../models/certificate-design-model.js";
import { ListCertificateDesignsService } from "../../services/certificate/list-certificate-designs-service.js";

export class ListCertificateDesignsController {
  async handle(req: Request, res: Response) {
    const folderQuery = z.object({
      scope: z.enum(CERTIFICATE_SCOPES, { error: "The scope must be default, campaign or event" }),
      target_id: z.uuid({ error: "The target id must be a valid uuid" })
        .nullish()
        .default(null),
    })

    const parsedFolderQuery = folderQuery.safeParse(req.query)

    if (!parsedFolderQuery.success) {
      const errors = parsedFolderQuery.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { scope, target_id } = parsedFolderQuery.data

    try {
      const listCertificateDesignsService = new ListCertificateDesignsService()
      const designs = await listCertificateDesignsService.execute({ scope, target_id })

      return res.status(200).json({ message: "Certificate Designs Fetched Successfully", designs })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
