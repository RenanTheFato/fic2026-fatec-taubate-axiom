// Conteúdo institucional. Nenhum desses dados tem rota no backend ainda: são as
// informações que a própria ONG mantém. Os tipos já são os definitivos para que
// a troca, quando vier, seja de uma função em `services/`.

export type PersonBoard = "diretoria" | "conselho-fiscal" | "conselho-consultivo"

export type Person = {
  id: string
  name: string
  /** Cargo estatutário: "Presidente", "1º Tesoureiro", "Conselheiro titular". */
  position: string
  board: PersonBoard
  /** Mandato, quando informado: "2024–2026". */
  term: string | null
  /** Caminho da foto em `public/imagens/pessoas/`. */
  photo: string | null
}

export type FaqCategory = "atendimento" | "doacao" | "voluntariado" | "institucional"

export type FaqItem = {
  id: string
  question: string
  answer: string
  category: FaqCategory
}

export type DocumentCategory = "estatuto" | "certificacoes" | "financeiro" | "atividades"

export type TransparencyDocument = {
  id: string
  title: string
  description: string | null
  category: DocumentCategory
  /** Ano de referência do documento, não o de publicação. */
  year: number
  /** Caminho do PDF em `public/documentos/`. */
  file: string
}
