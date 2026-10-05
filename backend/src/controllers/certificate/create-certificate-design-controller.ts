import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError } from "../../config/errors.js";
import { CERTIFICATE_SCOPES } from "../../models/certificate-design-model.js";
import { CreateCertificateDesignService } from "../../services/certificate/create-certificate-design-service.js";
import { certificateDesignSchema } from "../../utils/certificate-design.js";

export class CreateCertificateDesignController {
  async handle(req: Request, res: Response) {
    const designValidate = z.object({
      scope: z.enum(CERTIFICATE_SCOPES, { error: "The scope must be default, campaign or event" }),
      target_id: z.uuid({ error: "The target id must be a valid uuid" })
        .nullish()
        .default(null),
      label: z.string({ error: "The label must be a string" })
        .trim()
        .min(2, { error: "The label must be at least 2 characters long" })
        .max(120, { error: "The label has exceeded the maximum length (120)" }),
      design: certificateDesignSchema(),
    })

    const parsedDesign = designValidate.safeParse(req.body)

    if (!parsedDesign.success) {
      const errors = parsedDesign.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { scope, target_id, label, design } = parsedDesign.data

    try {
      const createCertificateDesignService = new CreateCertificateDesignService()
      const created = await createCertificateDesignService.execute({
        scope,
        target_id,
        label,
        design,
        created_by: req.user?.id ?? null,
      })

      return res.status(201).json({ message: "Certificate Version Created Successfully", design: created })
    } catch (error: unknown) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
