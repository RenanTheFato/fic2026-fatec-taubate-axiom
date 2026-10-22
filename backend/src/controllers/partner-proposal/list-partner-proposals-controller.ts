import { Request, Response } from "express";
import { z } from "zod/v4";
import { PROPOSAL_KINDS, PROPOSAL_STATUSES } from "../../models/partner-proposal-model.js";
import { ListPartnerProposalsService } from "../../services/partner-proposal/list-partner-proposals-service.js";

export class ListPartnerProposalsController {
  async handle(req: Request, res: Response) {
    const proposalsQuery = z.object({
      status: z.enum(PROPOSAL_STATUSES, { error: "The status must be pending, accepted, refused or withdrawn" })
        .nullish()
        .default(null),
      kind: z.enum(PROPOSAL_KINDS, { error: "The kind must be campaign, contribution, sponsorship, in_kind or volunteering" })
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

    const parsedProposalsQuery = proposalsQuery.safeParse(req.query)

    if (!parsedProposalsQuery.success) {
      const errors = parsedProposalsQuery.error.issues.map((err) => ({
        message: err.message,
        code: err.code,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Errors Occurred", errors })
    }

    const { status, kind, page, limit } = parsedProposalsQuery.data

    try {
      const listPartnerProposalsService = new ListPartnerProposalsService()
      const { proposals, total, pending } = await listPartnerProposalsService.execute({ status, kind, page, limit })

      return res.status(200).json({ message: "Proposals Fetched Successfully", proposals, total, pending })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
