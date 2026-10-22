import type { BadgeTone } from "../ui/badge"
import type { CertificateFolder, CertificateScope, CertificateVariant } from "../../types/certificate-types"

// Rótulos do estúdio de certificados, num lugar só, como os de transação e os
// de notícia: a lista de pastas, o cabeçalho da pasta e o editor dizem a mesma
// palavra.
export const SCOPE_LABEL: Record<CertificateScope, { label: string; tone: BadgeTone }> = {
  default: { label: "Modelo padrão", tone: "institutional" },
  campaign: { label: "Campanha", tone: "primary" },
  event: { label: "Evento", tone: "partner" },
}

// As duas variações de cada pasta. A palavra da URL é em português, como toda
// rota do site; o valor da API é o do backend.
export const VARIANT_LABEL: Record<CertificateVariant, { label: string; param: string; description: string }> = {
  amount: { label: "Com valor", param: "valor", description: "O certificado mostra o valor da contribuição." },
  message: { label: "Com mensagem", param: "mensagem", description: "Uma mensagem no lugar do valor, para quem prefere não mostrar quanto deu." },
}

export const VARIANTS: CertificateVariant[] = ["amount", "message"]

export function variantFromParam(value: string | null): CertificateVariant {
  return value === VARIANT_LABEL.message.param ? "message" : "amount"
}

// O complemento de "destinada" que o certificado imprime. É o mesmo texto que o
// backend monta em `destinationPhrase`.
export function folderDestination(folder: Pick<CertificateFolder, "scope" | "title">): string | null {
  if (folder.scope === "campaign") return `à campanha ${folder.title}`
  if (folder.scope === "event") return `ao evento ${folder.title}`

  return null
}

// De onde sai o certificado de uma pasta que ainda não foi personalizada. É a
// mesma ordem que a emissão do recibo segue: evento, campanha, modelo padrão.
export function fallbackLine(scope: CertificateScope): string {
  if (scope === "event") return "Sem versão própria: usa a da campanha ou o modelo padrão."
  if (scope === "campaign") return "Sem versão própria: usa o modelo padrão."

  return "Sem versão: usa o modelo de fábrica."
}
