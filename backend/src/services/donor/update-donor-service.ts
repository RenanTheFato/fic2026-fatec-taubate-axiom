import { BadRequestError, NotFoundError } from "../../config/errors.js";
import { DonorInterface } from "../../interfaces/donor-interface.js";
import { Donor } from "../../models/donor-model.js";

interface UpdateDonorProps {
  id: DonorInterface['id'],
  name?: DonorInterface['name'],
  email?: DonorInterface['email'],
  phone?: DonorInterface['phone'],
}

export class UpdateDonorService {
  async execute({ id, name, email, phone }: UpdateDonorProps) {

    const donor = await Donor.findByPk(id)

    if (!donor) {
      throw new NotFoundError("Donor Not Found")
    }

    // Repovoar um doador anonimizado desfaz o pedido de exclusão que a LGPD garantiu.
    if (donor.anonymized_at) {
      throw new BadRequestError("Cannot be possible to update an anonymized donor")
    }

    await donor.update({
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(phone !== undefined ? { phone } : {}),
    })

    return donor.get({ plain: true })
  }
}
