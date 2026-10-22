import { Request, Response } from "express";
import { z } from "zod/v4";
import { VOLUNTEER_AREAS } from "../../models/volunteer-model.js";
import { CreateVolunteerShiftService } from "../../services/volunteer-shift/create-volunteer-shift-service.js";

const MAX_SHIFT_HOURS = 12

export class CreateVolunteerShiftController {
  async handle(req: Request, res: Response) {
    const shiftValidate = z.object({
      activity: z.string({ error: "The activity must be a string" })
        .trim()
        .min(3, { error: "The activity doesn't meet the minimum number of characters (3)." })
        .max(160, { error: "The activity has exceeded the character limit (160)." }),
      area: z.enum(VOLUNTEER_AREAS, { error: "The area is not one of the volunteering fronts." }),
      place: z.string({ error: "The place must be a string" })
        .trim()
        .min(3, { error: "The place doesn't meet the minimum number of characters (3)." })
        .max(120, { error: "The place has exceeded the character limit (120)." }),
      coordinator: z.string({ error: "The coordinator must be a string" })
        .trim()
        .min(3, { error: "The coordinator doesn't meet the minimum number of characters (3)." })
        .max(128, { error: "The coordinator has exceeded the character limit (128)." }),
      description: z.string({ error: "The description must be a string" })
        .trim()
        .max(2000, { error: "The description has exceeded the character limit (2000)." })
        .nullish()
        .transform((description) => description || null),
      starts_at: z.coerce.date({ error: "The start isn't a valid date." }),
      ends_at: z.coerce.date({ error: "The end isn't a valid date." }),
      slots: z.number({ error: "The slots must be a number" })
        .int({ error: "The slots must be an integer" })
        .positive({ error: "The slots must be greater than zero" })
        .max(200, { error: "The slots have exceeded the maximum allowed (200)" }),
    }).superRefine((shift, ctx) => {
      if (shift.starts_at.getTime() <= Date.now()) {
        ctx.addIssue({ code: "custom", path: ["starts_at"], message: "The shift must start in the future." })
      }

      if (shift.ends_at <= shift.starts_at) {
        ctx.addIssue({ code: "custom", path: ["ends_at"], message: "The end must be after the start." })
      }

      // Um turno é um período do dia, e é a duração dele que vira hora de voluntariado.
      if (shift.ends_at.getTime() - shift.starts_at.getTime() > MAX_SHIFT_HOURS * 3_600_000) {
        ctx.addIssue({ code: "custom", path: ["ends_at"], message: `A shift lasts at most ${MAX_SHIFT_HOURS} hours.` })
      }
    })

    const parsedShift = shiftValidate.safeParse(req.body)

    if (!parsedShift.success) {
      const errors = parsedShift.error.issues.map((err) => ({
        code: err.code,
        message: err.message,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { activity, area, place, coordinator, description, starts_at, ends_at, slots } = parsedShift.data

    try {
      const createVolunteerShiftService = new CreateVolunteerShiftService()
      const shift = await createVolunteerShiftService.execute({
        activity,
        area,
        place,
        coordinator,
        description,
        starts_at,
        ends_at,
        slots,
        created_by: req.user?.id ?? null,
      })

      return res.status(201).json({ message: "Shift Created Successfully", shift })
    } catch (error: unknown) {
      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
