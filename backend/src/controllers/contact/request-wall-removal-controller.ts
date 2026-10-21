import { Request, Response } from "express";
import { z } from "zod/v4";
import { RequestWallRemovalService } from "../../services/contact/request-wall-removal-service.js";

export class RequestWallRemovalController {
  async handle(req: Request, res: Response) {
    const removalValidate = z.object({
      name: z.string({ error: "The name must be a string" })
        .trim()
        .min(2, { error: "The name doesn't meet the minimum number of characters (2)." })
        .max(128, { error: "The name has exceeded the character limit (128)." }),
      email: z.email({ error: "The value has entered isn't a email or the email is invalid." })
        .max(128, { error: "The email has exceeded the character limit (128)." }),
      message: z.string({ error: "The message must be a string" })
        .trim()
        .max(2000, { error: "The message has exceeded the character limit (2000)." })
        .transform((message) => message.length > 0 ? message : null)
        .nullish()
        .default(null),
    })

    const parsedRemoval = removalValidate.safeParse(req.body)

    if (!parsedRemoval.success) {
      const errors = parsedRemoval.error.issues.map((err) => ({
        code: err.code,
        message: err.message,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { name, email, message } = parsedRemoval.data

    try {
      const requestWallRemovalService = new RequestWallRemovalService()
      const contact = await requestWallRemovalService.execute({ name, email, message })

      return res.status(201).json({ message: "Removal Request Received Successfully", contact })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
