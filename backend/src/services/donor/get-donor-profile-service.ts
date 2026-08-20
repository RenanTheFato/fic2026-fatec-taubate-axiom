import { NotFoundError } from "../../config/errors.js";
import { DonorInterface } from "../../interfaces/donor-interface.js";
import { Donor } from "../../models/donor-model.js";

export class GetDonorProfileService{
  async execute({ user_id }: Pick<DonorInterface, 'user_id'>) {
    const donor = await Donor.findOne({
      where: {
        user_id,
      }
    })

      if (!donor) {
        throw new NotFoundError("Donor not found")
      }

      return donor
  }
}