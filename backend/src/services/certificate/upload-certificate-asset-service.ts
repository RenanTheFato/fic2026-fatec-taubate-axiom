import { BadRequestError } from "../../config/errors.js";
import { CertificateAssetInterface } from "../../interfaces/certificate-asset-interface.js";
import { CertificateAsset } from "../../models/certificate-asset-model.js";
import { readImageInfo } from "../../utils/image-size.js";

export const MAX_ASSET_BYTES = 3 * 1024 * 1024

// Uma imagem de 6000 px de lado não melhora um enfeite de 80 pontos e deixa todo certificado que
// a usa pesado para baixar. O teto é generoso para um fundo de página inteira impresso.
const MAX_ASSET_SIDE = 4000

interface UploadCertificateAssetProps {
  name: CertificateAssetInterface['name'],
  data: Buffer,
  uploaded_by: CertificateAssetInterface['uploaded_by'],
}

export class UploadCertificateAssetService {
  async execute({ name, data, uploaded_by }: UploadCertificateAssetProps) {

    if (data.length === 0) {
      throw new BadRequestError("The image is empty")
    }

    if (data.length > MAX_ASSET_BYTES) {
      throw new BadRequestError("The image has exceeded the maximum size (3 MB)")
    }

    const info = readImageInfo(data)

    if (!info) {
      throw new BadRequestError("Only PNG and JPEG images are accepted")
    }

    if (info.width > MAX_ASSET_SIDE || info.height > MAX_ASSET_SIDE) {
      throw new BadRequestError(`The image must be at most ${MAX_ASSET_SIDE} pixels on each side`)
    }

    const asset = await CertificateAsset.create({
      name,
      mime_type: info.mime_type,
      width: info.width,
      height: info.height,
      size: data.length,
      data,
      uploaded_by,
    })

    // O arquivo não volta na resposta: quem enviou já o tem, e a listagem só precisa da ficha.
    const { data: _data, ...metadata } = asset.get({ plain: true })

    return metadata
  }
}
