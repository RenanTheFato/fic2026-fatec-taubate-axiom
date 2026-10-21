import { Request, Response } from "express";
import { z } from "zod/v4";
import { CONTACT_CHANNELS, CONTACT_STATUSES } from "../../models/contact-message-model.js";
import { ListContactMessagesService } from "../../services/contact/list-contact-messages-service.js";

export class ListContactMessagesController {
  async handle(req: Request, res: Response) {
    const contactQuery = z.object({
      status: z.enum(CONTACT_STATUSES, { error: "The status must be open or resolved" })
        .nullish()
        .default(null),
      channel: z.enum(CONTACT_CHANNELS, { error: "The channel must be contact, ombudsman, work or wall_removal" })
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

    const parsedContactQuery = contactQuery.safeParse(req.query)

    if (!parsedContactQuery.success) {
      const errors = parsedContactQuery.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { status, channel, page, limit } = parsedContactQuery.data

    try {
      const listContactMessagesService = new ListContactMessagesService()
      const { contacts, total, open } = await listContactMessagesService.execute({ role: req.user?.role, status, channel, page, limit })

      return res.status(200).json({ message: "Messages Fetched Successfully", contacts, total, open })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
