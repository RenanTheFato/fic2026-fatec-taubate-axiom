import { BadRequestError } from "../../config/errors.js";
import { UserInterface } from "../../interfaces/user-interface.js";
import { User } from "../../models/user-model.js";

export class CreateUserService {
  async execute({ email, hashed_password, name }: Pick<UserInterface, 'email' | 'hashed_password' | 'name'>) {
    const verifyEmailInUse = await User.findOne({
      where: {
        email
      }
    })

    if (verifyEmailInUse) {
      throw new BadRequestError("Email is already in use")
    }

    const user = await User.create({
      email,
      hashed_password,
      name,
      role: "volunteer"
    })

    return user
  }
}