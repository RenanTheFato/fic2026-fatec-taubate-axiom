import { BadRequestError } from "../../config/errors.js";
import { DonorInterface } from "../../interfaces/donor-interface.js";
import { Donor, DocumentType } from "../../models/donor-model.js";

export class CreateDonorService {
  async execute({ name, email, document, phone }: Pick<DonorInterface, 'name' | 'email' | 'document' | 'phone'>) {

    // O tipo do documento é derivado do próprio documento, nunca informado pelo cliente
    let normalizedDocument: string | null = null
    let documentType: DocumentType | null = null

    if (document) {
      normalizedDocument = document.replace(/\D/g, "")

      if (normalizedDocument.length !== 11 && normalizedDocument.length !== 14) {
        throw new BadRequestError("The document must be a valid CPF (11 digits) or CNPJ (14 digits)")
      }

      documentType = normalizedDocument.length === 11 ? "cpf" : "cnpj"
    }

    // Doador repetido não é erro: a mesma pessoa doa várias vezes. O futuro fluxo de transação
    // reaproveita este service em vez de duplicar cadastro a cada doação.
    const existingDonor = await Donor.findOne({
      where: normalizedDocument ? { document: normalizedDocument } : { email }
    })

    if (existingDonor) {
      return { donor: existingDonor.get({ plain: true }), created: false }
    }

    const donor = await Donor.create({
      name,
      email,
      document: normalizedDocument,
      document_type: documentType,
      phone
    })

    return { donor: donor.get({ plain: true }), created: true }
  }
}
