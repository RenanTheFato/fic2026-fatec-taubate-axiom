import { Op, WhereOptions } from "sequelize";
import { Donor } from "../../models/donor-model.js";
import { DonorInterface } from "../../interfaces/donor-interface.js";

export class ListDonorsService {
  async execute({ page, limit, search }: { page: number, limit: number, search?: string }) {
    const escapedSearch = search ? search.replace(/[\\%_]/g, (char) => `\\${char}`) : ""
    const searchDigits = search ? search.replace(/\D/g, "") : ""

    const where: WhereOptions<DonorInterface> | undefined = search
      ? {
        [Op.or]: [
          { name: { [Op.like]: `%${escapedSearch}%` } },
          { email: { [Op.like]: `%${escapedSearch}%` } },
          ...(searchDigits ? [{ document: { [Op.like]: `%${searchDigits}%` } }] : []),
        ]
      }
      : undefined

    const { rows: donors, count: total } = await Donor.findAndCountAll({
      ...(where ? { where } : {}),
      order: [
        ["name", "ASC"],
        ["created_at", "DESC"],
        ["id", "ASC"],
      ],
      limit: limit,
      offset: (page - 1) * limit,
    })

    return { donors, total }
  }
}
