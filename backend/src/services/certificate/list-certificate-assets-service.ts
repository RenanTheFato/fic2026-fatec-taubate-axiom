import { CertificateAsset } from "../../models/certificate-asset-model.js";

// A biblioteca de imagens da associação: fundos e enfeites que qualquer pasta pode usar. Só a
// ficha de cada uma sai daqui; o arquivo é servido pela rota pública do asset.
export class ListCertificateAssetsService {
  async execute() {
    const assets = await CertificateAsset.findAll({
      attributes: { exclude: ["data"] },
      order: [["created_at", "DESC"], ["id", "ASC"]],
    })

    return assets.map((asset) => asset.get({ plain: true }))
  }
}
