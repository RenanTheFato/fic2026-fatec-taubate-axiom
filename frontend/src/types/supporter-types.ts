// O que o mural de apoiadores devolve. Só o nome: valor, data e quantas vezes a
// pessoa contribuiu nunca saem da API, e o tipo existe também para que ninguém
// tente desenhar o que não chega.
export type Supporter = {
  name: string
}

export type SupporterPage = {
  supporters: Supporter[]
  /** Quantos aparecem no mural, somando todas as páginas. */
  total: number
  /** Quantos contribuíram, incluindo quem preferiu não aparecer. */
  contributors: number
  /** A semente da ordem. Repetida nas próximas páginas, mantém a ordem estável. */
  seed: string
}

export type SupporterScope =
  | { kind: "site" }
  | { kind: "campaign"; slug: string }
  | { kind: "event"; slug: string }
