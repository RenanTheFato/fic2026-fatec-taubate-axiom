import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { ReviewPartnerProposalService } from "../../services/partner-proposal/review-partner-proposal-service.js";

export class ReviewPartnerProposalController {
  async handle(req: Request, res: Response) {
    const proposalParams = z.object({
      id: z.uuid({ error: "The id must be a valid uuid" }),
    })

    // A resposta sempre diz algo à empresa: o motivo da recusa, ou como a proposta aceita segue.
    const reviewValidate = z.object({
      decision: z.enum(["accepted", "refused"], { error: "The decision must be accepted or refused" }),
      note: z.string({ error: "The note must be a string" })
        .trim()
        .min(10, { error: "The note doesn't meet the minimum number of characters (10)." })
        .max(2000, { error: "The note has exceeded the character limit (2000)." }),
    })

    const parsedParams = proposalParams.safeParse(req.params)
    const parsedReview = reviewValidate.safeParse(req.body)

    if (!parsedParams.success || !parsedReview.success) {
      const issues = [...(parsedParams.error?.issues ?? []), ...(parsedReview.error?.issues ?? [])]
      const errors = issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { id } = parsedParams.data
    const { decision, note } = parsedReview.data

    try {
      const reviewPartnerProposalService = new ReviewPartnerProposalService()
      const proposal = await reviewPartnerProposalService.execute({ id, decision, note, reviewed_by: req.user?.id ?? null })

      return res.status(200).json({ message: "Proposal Answered Successfully", proposal })
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
