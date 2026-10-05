import { Request, Response } from "express";
import { z } from "zod/v4";
import { NotFoundError } from "../../config/errors.js";
import { GetCertificateAssetService } from "../../services/certificate/get-certificate-asset-service.js";

export class GetCertificateAssetController {
  async handle(req: Request, res: Response) {
    const assetParams = z.object({
      id: z.uuid({ error: "The id must be a valid uuid" }),
    })

    const parsedAssetParams = assetParams.safeParse(req.params)

    if (!parsedAssetParams.success) {
      const errors = parsedAssetParams.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { id } = parsedAssetParams.data

    try {
      const getCertificateAssetService = new GetCertificateAssetService()
      const asset = await getCertificateAssetService.execute({ id })

      // Um asset nunca muda depois de enviado, então o navegador pode guardá-lo para sempre. O
      // `cross-origin` libera a imagem para o editor, que mora em outra origem (o site).
      res.set({
        "Content-Type": asset.mime_type,
        "Content-Length": String(asset.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Cross-Origin-Resource-Policy": "cross-origin",
      })

      return res.status(200).send(asset.data)
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
