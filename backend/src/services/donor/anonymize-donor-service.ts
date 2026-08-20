import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { DonorInterface } from "../../interfaces/donor-interface.js";
import { Donor } from "../../models/donor-model.js";

export class AnonymizeDonorService {
  async execute({ id }: Pick<DonorInterface, 'id'>) {

    const donor = await Donor.findByPk(id)

    if (!donor) {
      throw new NotFoundError("Donor Not Found")
    }

    if (donor.anonymized_at) {
      throw new BadRequestError("This donor has already been anonymized")
    }

    await donor.update({
      name: "Anonymized Donor",
      email: `anonymized-${donor.id}@removido.invalid`,
      document: null,
      document_type: null,
      phone: null,
      user_id: null,
      anonymized_at: new Date(),
    })

    return donor.get({ plain: true })
  }
}
