import axios from "axios"
import { api } from "../../config/api"
import { env } from "../../config/env"
import { NotFoundError } from "../../config/errors"
import type { CertificateView } from "../../types/certificate-types"

type CertificateViewResponse = { certificate: CertificateView }

// A segunda via pública do certificado. Rota sem token: o código de 64
// caracteres é a credencial, como na verificação. Volta o desenho com que o
// recibo nasceu e os dados já escritos como o PDF os escreve.
export async function getCertificateView(hash: string): Promise<CertificateView> {
  try {
    const { data } = await api.get<CertificateViewResponse>(`/receipt/view-certificate/${encodeURIComponent(hash)}`)

    return data.certificate
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new NotFoundError("Certificado não encontrado")
    }

    throw error
  }
}

// O PDF do certificado, para baixar ou imprimir. Vem como arquivo, e a tela
// decide o que fazer com ele.
export async function downloadCertificatePdf(hash: string): Promise<Blob> {
  const { data } = await api.get<Blob>(`/receipt/certificate/${encodeURIComponent(hash)}`, { responseType: "blob" })

  return data
}

export function certificatePdfUrl(hash: string): string {
  return `${env.apiUrl}/receipt/certificate/${encodeURIComponent(hash)}`
}
