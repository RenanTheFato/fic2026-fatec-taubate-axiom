import { Donor } from "../../models/donor-model.js";

export class ListDonorsService {
  async execute({ page, limit }: { page: number, limit: number }) {
    const { rows: donors, count: total } = await Donor.findAndCountAll({
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