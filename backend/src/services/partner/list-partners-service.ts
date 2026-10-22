import { Partner } from "../../models/partner-model.js";

// A rede pública da página de parceiros: só empresa aprovada que autorizou mostrar a marca. Sai o
// nome, o logo e o site, e nada do cadastro: documento, contato e propostas são assunto da
// associação com a empresa.
export class ListPartnersService {
  async execute() {
    const partners = await Partner.findAll({
      where: { status: "approved", public_listing: true },
      attributes: ["id", "company_name", "logo_url", "website"],
      order: [["company_name", "ASC"], ["id", "ASC"]],
    })

    return partners.map((partner) => ({
      id: partner.id,
      name: partner.company_name,
      logo: partner.logo_url,
      site: partner.website,
    }))
  }
}
