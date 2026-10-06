// Conteúdo institucional, mantido pela própria associação. Os tipos são os
// definitivos, então o dia em que esses dados tiverem rota na API, a troca é de
// uma função em `services/`.

// A diretoria tem dois colegiados, e eles não são a mesma lista: a eleita são os
// cargos escolhidos em assembleia, e a nomeada são as pastas por área. A mesma
// pessoa pode estar nas duas, então cada participação é um registro próprio, e
// não um cargo com dois nomes dentro.
export type PersonBoard =
  | "diretoria-eleita"
  | "diretoria-nomeada"
  | "conselho-fiscal"
  | "conselho-consultivo"

export type Person = {
  id: string
  name: string
  /** Cargo estatutário: "Presidente", "1º Tesoureiro", "Conselheiro titular". */
  position: string
  board: PersonBoard
  /** Mandato, quando informado: "2024 a 2026". */
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
