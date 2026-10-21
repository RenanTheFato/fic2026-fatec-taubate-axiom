import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError } from "../../config/errors.js";
import { UploadPhotoService } from "../../services/photo/upload-photo-service.js";

export class UploadPhotoController {
  async handle(req: Request, res: Response) {
    // O corpo é o próprio arquivo, cru, como no envio de imagem do certificado. O nome vem na
    // query porque o corpo já está ocupado.
    const photoQuery = z.object({
      name: z.string({ error: "The name must be a string" })
        .trim()
        .min(1, { error: "The name is required" })
        .max(128, { error: "The name has exceeded the maximum length (128)" }),
    })

    const parsedPhotoQuery = photoQuery.safeParse(req.query)

    if (!parsedPhotoQuery.success) {
      const errors = parsedPhotoQuery.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ error: "Send the image as the request body with Content-Type image/png or image/jpeg" })
    }

    const { name } = parsedPhotoQuery.data

    try {
      const uploadPhotoService = new UploadPhotoService()
      const photo = await uploadPhotoService.execute({ name, data: req.body, uploaded_by: req.user?.id ?? null })

      return res.status(201).json({ message: "Photo Uploaded Successfully", photo })
    } catch (error: unknown) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
