import { NotFoundError } from "../../config/errors.js";
import { CertificateAssetInterface } from "../../interfaces/certificate-asset-interface.js";
import { CertificateAsset } from "../../models/certificate-asset-model.js";

export class GetCertificateAssetService {
  async execute({ id }: Pick<CertificateAssetInterface, 'id'>) {
    const asset = await CertificateAsset.findByPk(id, { attributes: ["id", "mime_type", "data", "size"] })

    if (!asset) {
      throw new NotFoundError("Asset Not Found")
    }

    return { mime_type: asset.mime_type, data: asset.data, size: asset.size }
  }
}
