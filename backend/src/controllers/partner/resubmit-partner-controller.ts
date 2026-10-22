import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { UserInterface } from "../../interfaces/user-interface.js";
import { PARTNER_INTERESTS } from "../../models/partner-model.js";
import { ResubmitPartnerService } from "../../services/partner/resubmit-partner-service.js";

export class ResubmitPartnerController {
  async handle(req: Request, res: Response) {
    const resubmitValidate = z.object({
      interests: z.array(z.enum(PARTNER_INTERESTS, { error: "The interest must be sponsorship, contribution, in_kind, volunteering or institutional" }), { error: "The interests must be a list" })
        .min(1, { error: "Choose at least one way of supporting." })
        .max(PARTNER_INTERESTS.length, { error: "The interests have exceeded the maximum allowed length." })
        .transform((interests) => [...new Set(interests)]),
      message: z.string({ error: "The message must be a string" })
        .trim()
        .min(20, { error: "The message doesn't meet the minimum number of characters (20)." })
        .max(3000, { error: "The message has exceeded the character limit (3000)." }),
    })

    const parsedResubmit = resubmitValidate.safeParse(req.body)

    if (!parsedResubmit.success) {
      const errors = parsedResubmit.error.issues.map((err) => ({
        code: err.code,
        message: err.message,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { interests, message } = parsedResubmit.data
    const { id } = req.user as Pick<UserInterface, 'id'>

    try {
      const resubmitPartnerService = new ResubmitPartnerService()
      const partner = await resubmitPartnerService.execute({ user_id: id, interests, message })

      return res.status(200).json({ message: "Partnership Request Sent Again Successfully", partner })
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
