import { Request, Response } from "express";
import { z } from "zod/v4";
import { NotFoundError } from "../../config/errors.js";
import { ListEventRegistrationsService } from "../../services/registration/list-event-registrations-service.js";

export class ListEventRegistrationsController {
  async handle(req: Request, res: Response) {
    const registrationParams = z.object({
      id: z.uuid({ error: "The id must be a valid uuid" }),
    })

    // A lista de presença é lida inteira na porta, então o teto é o tamanho de um evento grande, e
    // não o de uma página de tabela.
    const registrationQuery = z.object({
      page: z.coerce.number({ error: "The page must be an number" })
        .int({ error: "The page must be an integer" })
        .positive({ error: "The page number must be greater than zero" })
        .optional()
        .default(1),
      limit: z.coerce.number({ error: "The limit must be an number" })
        .int({ error: "The limit must be an integer" })
        .positive({ error: "The limit must be greater than zero" })
        .max(1000, { error: "The limit has exceeded the maximum allowed limit (1000)" })
        .optional()
        .default(500),
    })

    const parsedParams = registrationParams.safeParse(req.params)
    const parsedQuery = registrationQuery.safeParse(req.query)

    if (!parsedParams.success || !parsedQuery.success) {
      const issues = [
        ...(parsedParams.success ? [] : parsedParams.error.issues),
        ...(parsedQuery.success ? [] : parsedQuery.error.issues),
      ]
      const errors = issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { id } = parsedParams.data
    const { page, limit } = parsedQuery.data

    try {
      const listEventRegistrationsService = new ListEventRegistrationsService()
      const { event, registrations, total, summary } = await listEventRegistrationsService.execute({ event_id: id, page, limit })

      return res.status(200).json({ message: "Registrations Fetched Successfully", event, registrations, total, summary })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
