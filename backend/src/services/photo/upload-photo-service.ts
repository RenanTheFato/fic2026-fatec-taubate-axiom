import { BadRequestError } from "../../config/errors.js";
import { PhotoInterface } from "../../interfaces/photo-interface.js";
import { Photo } from "../../models/photo-model.js";
import { readImageInfo } from "../../utils/image-size.js";
import { photoUrl } from "../../utils/image-url.js";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024

// Foto de celular passa fácil de 4000 px. O painel reduz antes de enviar, mas a regra vale para
// quem chamar a rota direto: acima disso a capa só pesa no carregamento, sem ganhar nitidez.
const MAX_PHOTO_SIDE = 6000

interface UploadPhotoProps {
  name: PhotoInterface['name'],
  data: Buffer,
  uploaded_by: PhotoInterface['uploaded_by'],
}

export class UploadPhotoService {
  async execute({ name, data, uploaded_by }: UploadPhotoProps) {

    if (data.length === 0) {
      throw new BadRequestError("The image is empty")
    }

    if (data.length > MAX_PHOTO_BYTES) {
      throw new BadRequestError("The image has exceeded the maximum size (5 MB)")
    }

    const info = readImageInfo(data)

    if (!info) {
      throw new BadRequestError("Only PNG and JPEG images are accepted")
    }

    if (info.width > MAX_PHOTO_SIDE || info.height > MAX_PHOTO_SIDE) {
      throw new BadRequestError(`The image must be at most ${MAX_PHOTO_SIDE} pixels on each side`)
    }

    const photo = await Photo.create({
      name,
      mime_type: info.mime_type,
      width: info.width,
      height: info.height,
      size: data.length,
      data,
      uploaded_by,
    })

    // O arquivo não volta: quem enviou já o tem. Volta o endereço pronto, que é o que o cadastro
    // de campanha, evento, produto e notícia grava em `image_url`.
    const { data: _data, ...metadata } = photo.get({ plain: true })

    return { ...metadata, url: photoUrl(metadata.id) }
  }
}
