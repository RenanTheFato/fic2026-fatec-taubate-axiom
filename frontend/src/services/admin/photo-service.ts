import axios from "axios"
import { api } from "../../config/api"
import { CheckoutError } from "../../config/errors"
import type { Photo } from "../../types/photo-types"

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024

// A capa nunca aparece com mais de 1600 px de largura no site.
const MAX_SIDE = 1600

// Foto de celular chega com 4000 px e alguns megabytes. Reduzir aqui, antes de
// enviar, deixa o banco leve e a vitrine rápida para quem abre o site num
// aparelho modesto. Onde o navegador não sabe redesenhar, o arquivo vai como
// está e o limite do backend continua valendo.
async function shrink(file: File): Promise<Blob> {
  if (typeof createImageBitmap !== "function") return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))

    if (scale === 1) {
      bitmap.close()
      return file
    }

    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)

    const context = canvas.getContext("2d")

    if (!context) {
      bitmap.close()
      return file
    }

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    // PNG continua PNG, porque pode ter fundo transparente. Foto vira JPEG.
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, file.type, 0.85))

    return blob ?? file
  } catch {
    return file
  }
}

type UploadPhotoResponse = { photo: Photo }

// O arquivo vai cru no corpo, como no envio de imagem do certificado. O backend
// lê o tipo dos bytes, então um arquivo renomeado é recusado lá mesmo que passe
// por aqui.
export async function uploadPhoto(file: File): Promise<Photo> {
  if (file.type !== "image/png" && file.type !== "image/jpeg") {
    throw new CheckoutError("Envie uma foto em JPEG ou PNG.")
  }

  const body = await shrink(file)

  if (body.size > MAX_PHOTO_BYTES) {
    throw new CheckoutError("A foto passa de 5 MB. Escolha uma versão menor.")
  }

  const name = file.name.slice(0, 128) || "foto"

  try {
    const { data } = await api.post<UploadPhotoResponse>("/photo/upload", body, {
      params: { name },
      headers: { "Content-Type": file.type },
    })

    return data.photo
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      throw new CheckoutError("A foto não foi aceita. Envie um JPEG ou PNG de até 5 MB.")
    }

    if (axios.isAxiosError(error) && error.response?.status === 403) {
      throw new CheckoutError("Seu perfil não tem permissão para enviar fotos.")
    }

    throw error
  }
}
