import { NotFoundError } from "../../config/errors.js";
import { DonorInterface } from "../../interfaces/donor-interface.js";
import { Donor } from "../../models/donor-model.js";

export class GetDonorService{
  async execute({ id }: Pick<DonorInterface, 'id'>){
    const donor = await Donor.findByPk(id, {
      raw: true,
    })

    if (!donor) {
      throw new NotFoundError("Donor Not Found")
    }

    return donor
  }
}