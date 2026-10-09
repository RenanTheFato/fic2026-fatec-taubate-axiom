import { api } from "../../config/api"
import type { CertificateDesign, CertificateFolder, CertificateScope, IssuedCertificate } from "../../types/certificate-types"

export type CertificateFolders = { folders: CertificateFolder[]; factory: CertificateDesign }

// As pastas do estúdio: o modelo padrão, cada campanha e cada evento, com as
// contagens já somadas pelo banco, e o modelo de fábrica, de onde parte uma
// pasta que nunca teve versão. Responde a admin e comunicação.
export async function listCertificateFolders(): Promise<CertificateFolders> {
  const { data } = await api.get<CertificateFolders>("/certificate/list-folders")

  return { folders: data.folders, factory: data.factory }
}

// A pasta viaja na URL como "campaign:<id>", que é a mesma chave que o backend
// grava. Separar aqui evita que cada tela reinvente o parse.
export function parseFolder(folder: string): { scope: CertificateScope; target_id: string | null } {
  const [scope, target] = folder.split(":")

  if (scope === "campaign" || scope === "event") {
    return { scope, target_id: target ?? null }
  }

  return { scope: "default", target_id: null }
}

type ListIssuedResponse = { certificates: IssuedCertificate[]; total: number }

// Os certificados que já saíram de uma pasta. Traz nome de doador e responde a
// admin e financeiro: a Comunicação vê só as contagens.
export async function listIssuedCertificates(folder: string, page: number) {
  const { data } = await api.get<ListIssuedResponse>("/certificate/list-issued", {
    params: { ...parseFolder(folder), page, limit: 20 },
  })

  return data
}
