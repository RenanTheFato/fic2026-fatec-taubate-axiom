import { UniqueConstraintError } from "sequelize";
import { BadRequestError } from "../../config/errors.js";
import { sequelize } from "../../config/sequelize.js";
import { PartnerInterface } from "../../interfaces/partner-interface.js";
import { UserInterface } from "../../interfaces/user-interface.js";
import { Partner } from "../../models/partner-model.js";
import { User } from "../../models/user-model.js";

type ApplyPartnerProps = Pick<PartnerInterface, 'company_name' | 'document' | 'phone' | 'website' | 'interests' | 'message' | 'public_listing'>
  & Pick<UserInterface, 'name' | 'email' | 'hashed_password'>

// O pedido de parceria feito pelo site. Nasce a conta da empresa, com o papel `partner`, e o
// cadastro em análise, numa transação só: conta sem cadastro deixaria alguém entrar num painel que
// não sabe de quem é. Com a senha já criada, a empresa acompanha a análise pelo próprio painel.
export class ApplyPartnerService {
  async execute({ company_name, document, phone, website, interests, message, public_listing, name, email, hashed_password }: ApplyPartnerProps) {

    if (await User.findOne({ where: { email }, attributes: ["id"] })) {
      throw new BadRequestError("Email is already in use")
    }

    if (document && await Partner.findOne({ where: { document }, attributes: ["id"] })) {
      throw new BadRequestError("This CNPJ already has a partnership request")
    }

    try {
      const partner = await sequelize.transaction(async (t) => {
        const user = await User.create({ name, email, hashed_password, role: "partner" }, { transaction: t })

        return await Partner.create({
          user_id: user.id,
          company_name,
          document,
          phone,
          website,
          interests,
          message,
          public_listing,
          status: "pending",
        }, { transaction: t })
      })

      return { id: partner.id, company_name: partner.company_name, status: partner.status, created_at: partner.created_at }
    } catch (error: unknown) {
      // Dois pedidos simultâneos com o mesmo e-mail ou CNPJ passam juntos pelas buscas acima, e o
      // índice único recusa o segundo. Para quem pediu, é a mesma resposta das buscas.
      if (error instanceof UniqueConstraintError) {
        throw new BadRequestError("Email or CNPJ is already in use")
      }

      throw error
    }
  }
}
