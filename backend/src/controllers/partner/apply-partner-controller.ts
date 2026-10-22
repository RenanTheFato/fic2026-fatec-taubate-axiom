import { Request, Response } from "express";
import { hash } from "bcryptjs";
import { z } from "zod/v4";
import { BadRequestError } from "../../config/errors.js";
import { PARTNER_INTERESTS } from "../../models/partner-model.js";
import { ApplyPartnerService } from "../../services/partner/apply-partner-service.js";
import { isValidCnpj } from "../../utils/cnpj.js";

export class ApplyPartnerController {
  async handle(req: Request, res: Response) {
    const partnerValidate = z.object({
      company_name: z.string({ error: "The company name must be a string" })
        .trim()
        .min(3, { error: "The company name doesn't meet the minimum number of characters (3)." })
        .max(160, { error: "The company name has exceeded the character limit (160)." }),
      document: z.string({ error: "The CNPJ must be a string" })
        .transform((document) => document.replace(/\D/g, ""))
        .refine(isValidCnpj, { error: "The CNPJ is invalid." }),
      phone: z.string({ error: "The phone must be a string" })
        .trim()
        .min(8, { error: "The phone doesn't meet the minimum number of characters (8)." })
        .max(20, { error: "The phone has exceeded the character limit (20)." }),
      website: z.url({ protocol: /^https?$/, error: "The website must be a valid address." })
        .max(255, { error: "The website has exceeded the character limit (255)." })
        .nullish()
        .default(null),
      interests: z.array(z.enum(PARTNER_INTERESTS, { error: "The interest must be sponsorship, contribution, in_kind, volunteering or institutional" }), { error: "The interests must be a list" })
        .min(1, { error: "Choose at least one way of supporting." })
        .max(PARTNER_INTERESTS.length, { error: "The interests have exceeded the maximum allowed length." })
        .transform((interests) => [...new Set(interests)]),
      message: z.string({ error: "The message must be a string" })
        .trim()
        .min(20, { error: "The message doesn't meet the minimum number of characters (20)." })
        .max(3000, { error: "The message has exceeded the character limit (3000)." }),
      // A marca só aparece na rede pública do site com autorização. Ausente é `false`.
      public_listing: z.boolean({ error: "The public listing must be a boolean" })
        .optional()
        .default(false),
      name: z.string({ error: "The contact name must be a string" })
        .trim()
        .min(3, { error: "The contact name doesn't meet the minimum number of characters (3)." })
        .max(128, { error: "The contact name has exceeded the character limit (128)." }),
      email: z.email({ error: "The value has entered isn't a email or the email is invalid." })
        .max(128, { error: "The email has exceeded the character limit (128)." }),
      password: z.string({ error: "The password must be a string" })
        .min(8, { error: "The password doesn't meet the minimum number of characters (8)." })
        .max(255, { error: "The password has exceeded the character limit (255)." })
        .refine((password) => /[A-Z]/.test(password), { error: "Password must contain at least one uppercase letter." })
        .refine((password) => /[0-9]/.test(password), { error: "Password must contain at least one number." })
        .refine((password) => /[@#$*&]/.test(password), { error: "Password must contain at least one of this special characters ('@' '#' '$' '*' '&')." }),
    })

    const parsedPartner = partnerValidate.safeParse(req.body)

    if (!parsedPartner.success) {
      const errors = parsedPartner.error.issues.map((err) => ({
        code: err.code,
        message: err.message,
        path: err.path.join("/")
      }))

      return res.status(400).json({ error: "Validation Error Occurred", errors })
    }

    const { company_name, document, phone, website, interests, message, public_listing, name, email, password } = parsedPartner.data

    const hashedPassword = await hash(password, 10)

    try {
      const applyPartnerService = new ApplyPartnerService()
      const partner = await applyPartnerService.execute({
        company_name,
        document,
        phone,
        website,
        interests,
        message,
        public_listing,
        name,
        email,
        hashed_password: hashedPassword,
      })

      return res.status(201).json({ message: "Partnership Request Received Successfully", partner })
    } catch (error: unknown) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).json({ error: "Internal Server Error" })
    }
  }
}
