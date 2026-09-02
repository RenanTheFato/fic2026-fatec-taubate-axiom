import type { TransparencyDocument } from "../../types/institutional-types"

// PROVISÓRIO E VAZIO DE PROPÓSITO — mesma razão da lista de pessoas: documento
// de prestação de contas não se inventa. A página já sabe agrupar por categoria
// e por ano; falta o acervo.
//
// Para publicar um documento: salve o PDF em `public/documentos/` e acrescente
//   { id: "1", title: "Estatuto Social", description: null,
//     category: "estatuto", year: 2023, file: "/documentos/estatuto-social.pdf" }
const DOCUMENTS: TransparencyDocument[] = []

export async function listDocuments(): Promise<TransparencyDocument[]> {
  return DOCUMENTS
}
