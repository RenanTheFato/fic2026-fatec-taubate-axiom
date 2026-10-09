import axios from "axios"
import { api } from "../../config/api"
import { env } from "../../config/env"
import { CheckoutError } from "../../config/errors"
import type { CertificateAsset } from "../../types/certificate-types"

type ListAssetsResponse = { assets: CertificateAsset[] }

export async function listCertificateAssets(): Promise<CertificateAsset[]> {
  const { data } = await api.get<ListAssetsResponse>("/certificate/list-assets")

  return data.assets
}

export const MAX_ASSET_BYTES = 3 * 1024 * 1024

type UploadAssetResponse = { asset: CertificateAsset }

// O arquivo vai cru no corpo, com o tipo dele, e não em base64 dentro de JSON:
// a imagem chega com o próprio tamanho. O backend lê o tipo dos bytes, então
// um SVG renomeado para .png é recusado lá mesmo que passe por aqui.
export async function uploadCertificateAsset(file: File): Promise<CertificateAsset> {
  if (file.type !== "image/png" && file.type !== "image/jpeg") {
    throw new CheckoutError("Envie uma imagem PNG ou JPEG. PNG com fundo transparente funciona melhor para enfeites.")
  }

  if (file.size > MAX_ASSET_BYTES) {
    throw new CheckoutError("A imagem passa de 3 MB. Reduza o tamanho e envie de novo.")
  }

  const name = file.name.replace(/\.[^.]+$/, "").slice(0, 128) || "Imagem"

  try {
    const { data } = await api.post<UploadAssetResponse>("/certificate/upload-asset", file, {
      params: { name },
      headers: { "Content-Type": file.type },
    })

    return data.asset
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      const data = error.response.data as { error?: string } | undefined
      throw new CheckoutError(data?.error ?? "A imagem não foi aceita.")
    }

    throw error
  }
}

// A rota da imagem é pública e imutável, então uma `<img>` comum a carrega sem
// token, e o navegador a guarda em cache.
export function assetUrl(id: string): string {
  return `${env.apiUrl}/certificate/asset/${encodeURIComponent(id)}`
}

export function issuedCertificateUrl(hash: string): string {
  return `${env.apiUrl}/receipt/certificate/${encodeURIComponent(hash)}`
}
