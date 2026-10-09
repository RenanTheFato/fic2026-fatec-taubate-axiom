// Painel de Impacto. Os números institucionais são os que a associação publica e
// mantém; o tipo já é o definitivo, então o dia em que a API tiver a rota, só a
// função em `services/impact` muda.
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
}
