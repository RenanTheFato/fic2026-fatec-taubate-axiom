import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../config/errors.js";
import { UserInterface } from "../../interfaces/user-interface.js";
import { PAYABLE_KINDS, PROPOSAL_KINDS } from "../../models/partner-proposal-model.js";
import { CreatePartnerProposalService } from "../../services/partner-proposal/create-partner-proposal-service.js";
import { hasAtMostTwoDecimals } from "../../utils/money.js";

export class CreatePartnerProposalController {
  async handle(req: Request, res: Response) {
    const proposalValidate = z.object({
      kind: z.enum(PROPOSAL_KINDS, { error: "The kind must be campaign, contribution, sponsorship, in_kind or volunteering" }),
      title: z.string({ error: "The title must be a string" })
        .trim()
        .min(5, { error: "The title doesn't meet the minimum number of characters (5)." })
        .max(160, { error: "The title has exceeded the character limit (160)." }),
      description: z.string({ error: "The description must be a string" })
        .trim()
        .min(20, { error: "The description doesn't meet the minimum number of characters (20)." })
        .max(3000, { error: "The description has exceeded the character limit (3000)." }),
      amount: z.number({ error: "The amount must be a number" })
        .positive({ error: "The amount must be greater than zero" })
        .max(99999999.99, { error: "The amount has exceeded the maximum allowed value" })
        .refine(hasAtMostTwoDecimals, { error: "The amount must have at most two decimal places" })
        .transform((amount) => amount.toFixed(2))
        .nullish()
        .default(null),
      campaign_id: z.uuid({ error: "The campaign id must be a valid uuid" })
        .nullish()
        .default(null),
      event_id: z.uuid({ error: "The event id must be a valid uuid" })
        .nullish()
        .default(null),
    }).superRefine((proposal, ctx) => {
      // Aporte e patrocínio viram pagamento, então nascem com valor. As outras propostas podem
      // trazer uma estimativa, que não cobra nada.
      if (PAYABLE_KINDS.includes(proposal.kind) && proposal.amount === null) {
        ctx.addIssue({ code: "custom", path: ["amount"], message: "A contribution or a sponsorship requires the amount" })
      }

      // Patrocínio é de alguma coisa: uma campanha ou um evento. É a mesma regra do checkout.
      if (proposal.kind === "sponsorship" && !proposal.campaign_id && !proposal.event_id) {
        ctx.addIssue({ code: "custom", path: ["event_id"], message: "A sponsorship requires a campaign or an event" })
      }

      if (proposal.kind === "contribution" && proposal.event_id) {
        ctx.addIssue({ code: "custom", path: ["event_id"], message: "A contribution goes to a campaign or to the association, not to an event" })
      }

      // A sugestão de campanha é de uma campanha que ainda não existe.
      if (proposal.kind === "campaign" && (proposal.campaign_id || proposal.event_id)) {
        ctx.addIssue({ code: "custom", path: ["campaign_id"], message: "A campaign suggestion doesn't point to an existing campaign or event" })
      }
    })

    const parsedProposal = proposalValidate.safeParse(req.body)

    if (!parsedProposal.success) {
      const errors = parsedProposal.error.issues.map((err) => ({
        code: err.code,
        message: err.message,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { kind, title, description, amount, campaign_id, event_id } = parsedProposal.data
    const { id } = req.user as Pick<UserInterface, 'id'>

    try {
      const createPartnerProposalService = new CreatePartnerProposalService()
      const proposal = await createPartnerProposalService.execute({ user_id: id, kind, title, description, amount, campaign_id, event_id })

      return res.status(201).json({ message: "Proposal Sent Successfully", proposal })
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
