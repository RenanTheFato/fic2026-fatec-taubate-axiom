import { Request, Response } from "express";
import { z } from "zod/v4";
import { CONTACT_SUBJECTS } from "../../models/contact-message-model.js";
import { CreateContactMessageService } from "../../services/contact/create-contact-message-service.js";

export class CreateContactMessageController {
  async handle(req: Request, res: Response) {
    const contactValidate = z.object({
      channel: z.enum(["contact", "ombudsman", "work"], { error: "The channel must be contact, ombudsman or work" }),
      subject: z.string({ error: "The subject must be a string" }).trim(),
      name: z.string({ error: "The name must be a string" })
        .trim()
        .min(3, { error: "The name doesn't meet the minimum number of characters (3)." })
        .max(128, { error: "The name has exceeded the character limit (128)." }),
      email: z.email({ error: "The value has entered isn't a email or the email is invalid." })
        .max(128, { error: "The email has exceeded the character limit (128)." }),
      phone: z.string({ error: "The phone must be a string" })
        .trim()
        .min(8, { error: "The phone doesn't meet the minimum number of characters (8)." })
        .max(20, { error: "The phone has exceeded the character limit (20)." })
        .nullish()
        .default(null),
      message: z.string({ error: "The message must be a string" })
        .trim()
        .min(20, { error: "The message doesn't meet the minimum number of characters (20)." })
        .max(5000, { error: "The message has exceeded the character limit (5000)." }),
    }).refine((contact) => CONTACT_SUBJECTS[contact.channel].includes(contact.subject), {
      error: "The subject is not one of the options of this channel.",
      path: ["subject"],
    })

    const parsedContact = contactValidate.safeParse(req.body)

    if (!parsedContact.success) {
      const errors = parsedContact.error.issues.map((err) => ({
        code: err.code,
        message: err.message,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { channel, subject, name, email, phone, message } = parsedContact.data

    try {
      const createContactMessageService = new CreateContactMessageService()
      const contact = await createContactMessageService.execute({ channel, subject, name, email, phone, message })

      return res.status(201).json({ message: "Message Received Successfully", contact })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
