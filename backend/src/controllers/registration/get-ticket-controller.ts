import { Request, Response } from "express";
import { z } from "zod/v4";
import { NotFoundError } from "../../config/errors.js";
import { GetTicketService } from "../../services/registration/get-ticket-service.js";

export class GetTicketController {
  async handle(req: Request, res: Response) {
    const ticketParams = z.object({
      code: z.string({ error: "The code must be a string" })
        .trim()
        .min(10, { error: "The code doesn't meet the minimum number of characters (10)." })
        .max(16, { error: "The code has exceeded the character limit (16)." }),
    })

    const parsedTicketParams = ticketParams.safeParse(req.params)

    if (!parsedTicketParams.success) {
      const errors = parsedTicketParams.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { code } = parsedTicketParams.data

    try {
      const getTicketService = new GetTicketService()
      const ticket = await getTicketService.execute({ code })

      return res.status(200).json({ message: "Ticket Fetched Successfully", ticket })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
