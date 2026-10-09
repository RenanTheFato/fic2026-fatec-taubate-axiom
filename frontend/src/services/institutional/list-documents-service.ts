import type { TransparencyDocument } from "../../types/institutional-types"

// Vazio de propósito, pela mesma razão da lista de pessoas: documento de
// prestação de contas não se inventa. A página agrupa por categoria e por ano, e
// o acervo entra aqui conforme a associação publica cada arquivo.
//
// Para publicar um documento: salve o PDF em `public/documentos/` e acrescente
//   { id: "1", title: "Estatuto Social", description: null,
//     category: "estatuto", year: 2023, file: "/documentos/estatuto-social.pdf" }
const DOCUMENTS: TransparencyDocument[] = []

export async function listDocuments(): Promise<TransparencyDocument[]> {
  return DOCUMENTS
}
