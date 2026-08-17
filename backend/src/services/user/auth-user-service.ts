import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../../config/errors.js";
import { UserInterface } from "../../interfaces/user-interface.js";
import { User } from "../../models/user-model.js";

export class AuthUserService {
  async execute({ email, hashed_password: password }: Pick<UserInterface, 'email' | 'hashed_password'>) {
    const userIsRegistered = await User.findOne({
      where: {
        email
      }
    })

    if (!userIsRegistered) {
      throw new UnauthorizedError("Invalid email or password")
    }

    const checkPassword = await compare(password, userIsRegistered.hashed_password)

    if (!checkPassword) {
      throw new UnauthorizedError("Invalid email or password")
    }

    const token = jwt.sign({ id: userIsRegistered.id }, String(process.env.JWT_SECRET), { expiresIn: "2h" })

    return token 
  }
}