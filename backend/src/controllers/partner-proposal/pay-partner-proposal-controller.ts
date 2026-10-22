import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../config/errors.js";
import { UserInterface } from "../../interfaces/user-interface.js";
import { PayPartnerProposalService } from "../../services/partner-proposal/pay-partner-proposal-service.js";

export class PayPartnerProposalController {
  async handle(req: Request, res: Response) {
    const proposalParams = z.object({
      id: z.uuid({ error: "The id must be a valid uuid" }),
    })

    const parsedProposalParams = proposalParams.safeParse(req.params)

    if (!parsedProposalParams.success) {
      const errors = parsedProposalParams.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { id } = parsedProposalParams.data
    const { id: user_id } = req.user as Pick<UserInterface, 'id'>

    try {
      const payPartnerProposalService = new PayPartnerProposalService()
      const payment = await payPartnerProposalService.execute({ id, user_id })

      return res.status(201).json({ message: "Checkout Created Successfully", payment })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      if (error instanceof ForbiddenError) {
        return res.status(403).json({ error: error.message })
      }

      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
