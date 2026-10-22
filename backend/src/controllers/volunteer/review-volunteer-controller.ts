import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { ReviewVolunteerService } from "../../services/volunteer/review-volunteer-service.js";

export class ReviewVolunteerController {
  async handle(req: Request, res: Response) {
    const volunteerParams = z.object({
      id: z.uuid({ error: "The id must be a valid uuid" }),
    })

    // Como no pedido de parceria: a recusa leva motivo, que a pessoa lê no painel.
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

    const parsedParams = volunteerParams.safeParse(req.params)
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
      const reviewVolunteerService = new ReviewVolunteerService()
      const volunteer = await reviewVolunteerService.execute({ id, decision, note, reviewed_by: req.user?.id ?? null })

      return res.status(200).json({ message: "Volunteer Registration Reviewed Successfully", volunteer })
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
