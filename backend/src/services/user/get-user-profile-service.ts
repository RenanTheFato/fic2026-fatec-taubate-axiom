import { NotFoundError } from "../../config/errors.js";
import { UserInterface } from "../../interfaces/user-interface.js";
import { User } from "../../models/user-model.js";

export class GetUserProfileService{
  async execute({ id }: Pick<UserInterface, 'id'>) {
    const user = await User.findByPk(
      id, 
      {
        attributes: {
          exclude: ["hashed_password"]
        }
      })

      if (!user) {
        throw new NotFoundError("User not found")
      }

      return user
  }
}