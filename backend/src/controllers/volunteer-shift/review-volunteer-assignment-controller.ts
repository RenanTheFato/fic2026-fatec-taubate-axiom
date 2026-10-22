import { Request, Response } from "express";
import { z } from "zod/v4";
import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { ReviewVolunteerAssignmentService } from "../../services/volunteer-shift/review-volunteer-assignment-service.js";

export class ReviewVolunteerAssignmentController {
  async handle(req: Request, res: Response) {
    const assignmentParams = z.object({
      id: z.uuid({ error: "The id must be a valid uuid" }),
    })

    const reviewValidate = z.object({
      decision: z.enum(["confirmed", "cancelled"], { error: "The decision must be confirmed or cancelled" }),
    })

    const parsedParams = assignmentParams.safeParse(req.params)
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
    const { decision } = parsedReview.data

    try {
      const reviewVolunteerAssignmentService = new ReviewVolunteerAssignmentService()
      const assignment = await reviewVolunteerAssignmentService.execute({ id, decision })

      return res.status(200).json({ message: "Assignment Reviewed Successfully", assignment })
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
