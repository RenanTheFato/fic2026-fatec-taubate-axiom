import { Request, Response } from "express";
import { hash } from "bcryptjs";
import { z, ZodError } from "zod/v4";
import { BadRequestError } from "../../config/errors.js";
import { CreateUserService } from "../../services/user/create-user-service.js";

export class CreateUserController {
  async handle(req: Request, res: Response) {
    const userValidate = z.object({
      email: z.email({ error: "The value has entered isn't a email or the email is invalid." })
        .min(2, { error: "The email doesn't meet the minimum number of characters (2)." })
        .max(128, { error: "The email has exceeded the character limit (128)." }),
      password: z.string()
        .min(8, { error: "The password doesn't meet the minimum number of characters (8)." })
        .max(255, { error: "The password has exceeded the character limit (255)." })
        .refine((password) => /[A-Z]/.test(password), { error: "Password must contain at least one uppercase letter." })
        .refine((password) => /[0-9]/.test(password), { error: "Password must contain at least one number." })
        .refine((password) => /[@#$*&]/.test(password), { error: "Password must contain at least one of this special characters ('@' '#' '$' '*' '&')." }),
      name: z.string()
        .min(2, { error: "The name doesn't meet the minimum number of characters (2)." })
        .max(128, { error: "The name has exceeded the character limit (128)." }),
    })

    try {
      userValidate.parse(req.body)
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          code: err.code,
          message: err.message,
          path: err.path.join("/")
        }))

        return res.status(400).json({ message: "Validation Error Occurred", errors })
      }
    }

    const { email, password, name } = req.body as z.infer<typeof userValidate>

    const hashedPassword = await hash(password, 10)

    try {
      const createUserService = new CreateUserService();
      const user = await createUserService.execute({ email, hashed_password: hashedPassword, name });
      return res.status(201).json({ message: "User Created Successfully", user })
    } catch (error: unknown) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({ error: error.message })
      }

      console.error(error)
      return res.status(500).send({ error: "Internal Server Error" })
    }
  }
}