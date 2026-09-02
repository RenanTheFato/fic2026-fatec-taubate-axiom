// Painel de Impacto — ainda sem rota no backend. Os três números institucionais
// que a home mostra hoje vêm do site atual e continuam corretos como dado da
// ONG; a arrecadação e os voluntários ativos entram quando a API existir.
export type ImpactStat = {
  id: string
  value: number
  label: string
  detail: string
}

export type ImpactSummary = {
  stats: ImpactStat[]
  updated_at: string | null
}

export type ImpactProgram = {
  id: string
  name: string
  description: string
  people: number
  /** O que a doação vira dentro deste programa, em linguagem concreta. */
  turns_into: string
}

export type ImpactPanel = {
  summary: ImpactSummary
  programs: ImpactProgram[]
  /** Indicadores que só existirão quando o backend publicar o painel. */
  pending: string[]
}
