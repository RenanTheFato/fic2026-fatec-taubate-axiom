import { UniqueConstraintError } from "sequelize";
import { BadRequestError } from "../../config/errors.js";
import { sequelize } from "../../config/sequelize.js";
import { UserInterface } from "../../interfaces/user-interface.js";
import { VolunteerInterface } from "../../interfaces/volunteer-interface.js";
import { User } from "../../models/user-model.js";
import { Volunteer } from "../../models/volunteer-model.js";

type ApplyVolunteerProps = Pick<VolunteerInterface, 'phone' | 'city' | 'area' | 'availability' | 'about'>
  & Pick<UserInterface, 'name' | 'email' | 'hashed_password'>

// O cadastro de voluntariado feito pelo site. A pessoa cria a conta junto, e o cadastro fica em
// análise até a coordenação aprovar: só então ela vê os turnos abertos e entra na escala.
export class ApplyVolunteerService {
  async execute({ name, email, hashed_password, phone, city, area, availability, about }: ApplyVolunteerProps) {

    if (await User.findOne({ where: { email }, attributes: ["id"] })) {
      throw new BadRequestError("Email is already in use")
    }

    try {
      const volunteer = await sequelize.transaction(async (t) => {
        const user = await User.create({ name, email, hashed_password, role: "volunteer" }, { transaction: t })

        return await Volunteer.create({
          user_id: user.id,
          phone,
          city,
          area,
          availability,
          about,
          status: "pending",
        }, { transaction: t })
      })

      return { id: volunteer.id, status: volunteer.status, created_at: volunteer.created_at }
    } catch (error: unknown) {
      if (error instanceof UniqueConstraintError) {
        throw new BadRequestError("Email is already in use")
      }

      throw error
    }
  }
}
