import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { ReviewPartnerService } from "../../services/partner/review-partner-service.js";

export class ReviewPartnerController {
  async handle(req: Request, res: Response) {
    const partnerParams = z.object({
      id: z.uuid({ error: "The id must be a valid uuid" }),
    })

    // A recusa leva motivo, porque a empresa lê a nota no painel e precisa saber o que mudar para
    // pedir de novo. Na aprovação a nota é opcional: um recado de boas-vindas, se houver.
    const reviewValidate = z.object({
      decision: z.enum(["approved", "refused"], { error: "The decision must be approved or refused" }),
      note: z.string({ error: "The note must be a string" })
        .trim()
        .max(2000, { error: "The note has exceeded the character limit (2000)." })
        .nullish()
        .default(null),
    }).refine((review) => review.decision === "approved" || (review.note?.length ?? 0) >= 10, {
      error: "A refusal needs a reason of at least 10 characters.",
      path: ["note"],
    })

    const parsedParams = partnerParams.safeParse(req.params)
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
      const reviewPartnerService = new ReviewPartnerService()
      const partner = await reviewPartnerService.execute({ id, decision, note, reviewed_by: req.user?.id ?? null })

      return res.status(200).json({ message: "Partnership Request Reviewed Successfully", partner })
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
