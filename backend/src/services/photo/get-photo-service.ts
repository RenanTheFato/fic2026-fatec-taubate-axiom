import { NotFoundError } from "../../config/errors.js";
import { PhotoInterface } from "../../interfaces/photo-interface.js";
import { Photo } from "../../models/photo-model.js";

export class GetPhotoService {
  async execute({ id }: Pick<PhotoInterface, 'id'>) {
    const photo = await Photo.findByPk(id, { attributes: ["id", "mime_type", "data", "size"] })

    if (!photo) {
      throw new NotFoundError("Photo Not Found")
    }

    return { mime_type: photo.mime_type, data: photo.data, size: photo.size }
  }
}
