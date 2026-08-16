import { NotFoundError } from "../../config/errors.js";
import { UserInterface } from "../../interfaces/user-interface.js";
import { User } from "../../models/user-model.js";

export class DeleteUserService{
  async execute({ id }: Pick<UserInterface, 'id'>){
    const userExists = await User.findByPk(
      id,
      {
        attributes: {
          exclude: ["hashed_password"]
        }
      }
    )

    if (!userExists) {
      throw new NotFoundError("The user not exists")
    }

    await User.destroy({
      where: {
        id
      },
    })
  }
}