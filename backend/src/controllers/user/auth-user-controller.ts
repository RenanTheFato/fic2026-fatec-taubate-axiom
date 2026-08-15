import { Request, Response } from "express";
import { z, ZodError } from "zod/v4";
import { AuthUserService } from "../../services/user/auth-user-service.js";
import { UnauthorizedError } from "../../config/errors.js";

export class AuthUserController {
  async handle(req: Request, res: Response) {
    const authSchema = z.object({
      email: z.email({ error: "The value entered isn't an email or the email is invalid" })
        .min(1, { error: "The email cannot be an empty value" }),
      password: z.string({ error: "The value must be an string for password" })
        .min(1, { error: "The password cannot be an empty value" })
    })

    try {
      authSchema.parse(req.body)
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          code: err.code,
          message: err.message,
          path: err.path.join("/")
        }))
        return res.status(400).send({ error: "Authorization Validation Error Occurred", errors })
      }
    }

    const { email, password } = req.body as z.infer<typeof authSchema>

    try {
      const authService = new AuthUserService()
      const token = await authService.execute({ email, hashed_password: password })

      return res.status(200).json({ message: "User Authenticated Successfully", token })
    } catch (error: unknown) {
      if (error instanceof UnauthorizedError) {
        return res.status(401).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).send({ error: "Internal Server Error" })
    }
  }
}