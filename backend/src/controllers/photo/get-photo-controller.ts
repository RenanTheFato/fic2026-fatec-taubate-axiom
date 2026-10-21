import { Request, Response } from "express";
import { z } from "zod/v4";
import { NotFoundError } from "../../config/errors.js";
import { GetPhotoService } from "../../services/photo/get-photo-service.js";

export class GetPhotoController {
  async handle(req: Request, res: Response) {
    const photoParams = z.object({
      id: z.uuid({ error: "The id must be a valid uuid" }),
    })

    const parsedPhotoParams = photoParams.safeParse(req.params)

    if (!parsedPhotoParams.success) {
      const errors = parsedPhotoParams.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { id } = parsedPhotoParams.data

    try {
      const getPhotoService = new GetPhotoService()
      const photo = await getPhotoService.execute({ id })

      // Trocar a foto de uma campanha grava um id novo, e nunca reescreve o arquivo antigo: por
      // isso o navegador pode guardar cada foto para sempre. O `cross-origin` libera a imagem para
      // o site, que mora em outra origem.
      res.set({
        "Content-Type": photo.mime_type,
        "Content-Length": String(photo.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Cross-Origin-Resource-Policy": "cross-origin",
      })

      return res.status(200).send(photo.data)
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
