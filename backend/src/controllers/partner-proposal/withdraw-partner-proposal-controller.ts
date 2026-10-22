import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { UserInterface } from "../../interfaces/user-interface.js";
import { WithdrawPartnerProposalService } from "../../services/partner-proposal/withdraw-partner-proposal-service.js";

export class WithdrawPartnerProposalController {
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
      const withdrawPartnerProposalService = new WithdrawPartnerProposalService()
      const proposal = await withdrawPartnerProposalService.execute({ id, user_id })

      return res.status(200).json({ message: "Proposal Withdrawn Successfully", proposal })
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        return res.status(404).json({ error: error.message })
      }

      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
