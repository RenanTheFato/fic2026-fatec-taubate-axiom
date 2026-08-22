import { Request, Response } from "express";
import { z } from "zod/v4";
import { NotFoundError } from "../../config/errors.js";
import { GetEventBySlugService } from "../../services/event/get-event-by-slug-service.js";

export class GetEventBySlugController {
  async handle(req: Request, res: Response) {
    const getEventSlugParam = z.object({
      slug: z.string({ error: "The slug must be an string" })
    })

    const parsedGetEventSlugParam = getEventSlugParam.safeParse(req.params)

    if (!parsedGetEventSlugParam.success) {
      const errors = parsedGetEventSlugParam.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { slug } = parsedGetEventSlugParam.data

    try {
      const getEventBySlugService = new GetEventBySlugService()
      const campaign = await getEventBySlugService.execute({ slug })

      return res.status(200).json({ message: "Event Founded", campaign })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message})
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}