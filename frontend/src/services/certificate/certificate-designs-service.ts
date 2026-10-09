import axios from "axios"
import { api } from "../../config/api"
import { CheckoutError } from "../../config/errors"
import type { CertificateDesign, CertificateScope, CertificateVersion, CreateCertificateDesignInput } from "../../types/certificate-types"
import type { TransactionType } from "../../types/transaction-types"
import { parseFolder } from "./certificate-folders-service"

type ListDesignsResponse = { designs: CertificateVersion[] }

export async function listCertificateDesigns(folder: string): Promise<CertificateVersion[]> {
  const { data } = await api.get<ListDesignsResponse>("/certificate/list-designs", { params: parseFolder(folder) })

  return data.designs
}

type CreateDesignResponse = { design: CertificateVersion }

// Salvar é sempre criar a versão seguinte: o backend nunca sobrescreve uma
// versão, e o recibo antigo continua saindo com a roupa com que nasceu. A
// recusa de regra (contraste, imagem que não existe, gravação simultânea) vem
// com a mensagem do backend, que é a que a pessoa precisa ler.
export async function createCertificateDesign(input: CreateCertificateDesignInput): Promise<CertificateVersion> {
  try {
    const { data } = await api.post<CreateDesignResponse>("/certificate/create-design", input)

    return data.design
  } catch (error: unknown) {
    throw refusal(error)
  }
}

type PreviewInput = {
  design: CertificateDesign
  scope: CertificateScope
  target_id: string | null
  transaction_type: TransactionType
}

// A prévia é o PDF de verdade, gerado pelo mesmo template do certificado, com
// dados de exemplo e a tarja "MODELO". Volta como arquivo, e a tela o abre.
export async function previewCertificate(input: PreviewInput): Promise<Blob> {
  try {
    const { data } = await api.post<Blob>("/certificate/preview", input, { responseType: "blob" })

    return data
  } catch (error: unknown) {
    throw refusal(error)
  }
}

export async function previewCertificateVersion(id: string, transactionType: TransactionType = "donation"): Promise<Blob> {
  const { data } = await api.get<Blob>(`/certificate/preview/${encodeURIComponent(id)}`, {
    params: { transaction_type: transactionType },
    responseType: "blob",
  })

  return data
}

function refusal(error: unknown): unknown {
  if (axios.isAxiosError(error) && error.response?.status === 400) {
    const data = error.response.data as { error?: string; errors?: { message: string }[] } | Blob | undefined

    if (data && !(data instanceof Blob)) {
      return new CheckoutError(data.errors?.[0]?.message ?? data.error ?? "O certificado não pôde ser salvo.")
    }

    return new CheckoutError("O desenho tem um valor que o certificado não aceita.")
  }

  return error
}
