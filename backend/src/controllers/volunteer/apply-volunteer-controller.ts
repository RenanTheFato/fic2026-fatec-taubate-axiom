import { Request, Response } from "express";
import { hash } from "bcryptjs";
import { z } from "zod/v4";
import { BadRequestError } from "../../config/errors.js";
import { VOLUNTEER_AREAS, VOLUNTEER_PERIODS } from "../../models/volunteer-model.js";
import { ApplyVolunteerService } from "../../services/volunteer/apply-volunteer-service.js";

export class ApplyVolunteerController {
  async handle(req: Request, res: Response) {
    const volunteerValidate = z.object({
      name: z.string({ error: "The name must be a string" })
        .trim()
        .min(3, { error: "The name doesn't meet the minimum number of characters (3)." })
        .max(128, { error: "The name has exceeded the character limit (128)." }),
      email: z.email({ error: "The value has entered isn't a email or the email is invalid." })
        .max(128, { error: "The email has exceeded the character limit (128)." }),
      password: z.string({ error: "The password must be a string" })
        .min(8, { error: "The password doesn't meet the minimum number of characters (8)." })
        .max(255, { error: "The password has exceeded the character limit (255)." })
        .refine((password) => /[A-Z]/.test(password), { error: "Password must contain at least one uppercase letter." })
        .refine((password) => /[0-9]/.test(password), { error: "Password must contain at least one number." })
        .refine((password) => /[@#$*&]/.test(password), { error: "Password must contain at least one of this special characters ('@' '#' '$' '*' '&')." }),
      // A coordenação chama por telefone: sem DDD não dá para escalar ninguém.
      phone: z.string({ error: "The phone must be a string" })
        .trim()
        .max(20, { error: "The phone has exceeded the character limit (20)." })
        .refine((phone) => phone.replace(/\D/g, "").length >= 10, { error: "The phone needs the area code." }),
      city: z.string({ error: "The city must be a string" })
        .trim()
        .max(80, { error: "The city has exceeded the character limit (80)." })
        .nullish()
        .transform((city) => city || null),
      area: z.enum(VOLUNTEER_AREAS, { error: "The area is not one of the volunteering fronts." }),
      availability: z.array(z.enum(VOLUNTEER_PERIODS, { error: "The period must be manha, tarde, noite or fim-de-semana" }), { error: "The availability must be a list" })
        .min(1, { error: "Choose at least one period." })
        .max(VOLUNTEER_PERIODS.length, { error: "The availability has exceeded the maximum allowed length." })
        .transform((periods) => [...new Set(periods)]),
      about: z.string({ error: "The presentation must be a string" })
        .trim()
        .min(20, { error: "The presentation doesn't meet the minimum number of characters (20)." })
        .max(2000, { error: "The presentation has exceeded the character limit (2000)." }),
    })

    const parsedVolunteer = volunteerValidate.safeParse(req.body)

    if (!parsedVolunteer.success) {
      const errors = parsedVolunteer.error.issues.map((err) => ({
        code: err.code,
        message: err.message,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { name, email, password, phone, city, area, availability, about } = parsedVolunteer.data

    const hashedPassword = await hash(password, 10)

    try {
      const applyVolunteerService = new ApplyVolunteerService()
      const volunteer = await applyVolunteerService.execute({
        name,
        email,
        hashed_password: hashedPassword,
        phone,
        city,
        area,
        availability,
        about,
      })

      return res.status(201).json({ message: "Volunteer Registration Received Successfully", volunteer })
    } catch (error: unknown) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
