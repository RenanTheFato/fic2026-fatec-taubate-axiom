import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError } from "../../config/errors.js";
import { UploadCertificateAssetService } from "../../services/certificate/upload-certificate-asset-service.js";

export class UploadCertificateAssetController {
  async handle(req: Request, res: Response) {
    // O corpo é o próprio arquivo, cru, e não JSON com base64: a imagem chega com o tamanho dela, e
    // não um terço maior. O nome vem na query, porque o corpo já está ocupado.
    const assetQuery = z.object({
      name: z.string({ error: "The name must be a string" })
        .trim()
        .min(1, { error: "The name is required" })
        .max(128, { error: "The name has exceeded the maximum length (128)" }),
    })

    const parsedAssetQuery = assetQuery.safeParse(req.query)

    if (!parsedAssetQuery.success) {
      const errors = parsedAssetQuery.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ error: "Send the image as the request body with Content-Type image/png or image/jpeg" })
    }

    const { name } = parsedAssetQuery.data

    try {
      const uploadCertificateAssetService = new UploadCertificateAssetService()
      const asset = await uploadCertificateAssetService.execute({ name, data: req.body, uploaded_by: req.user?.id ?? null })

      return res.status(201).json({ message: "Asset Uploaded Successfully", asset })
    } catch (error: unknown) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
