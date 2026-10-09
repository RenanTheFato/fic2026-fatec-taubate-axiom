import type { ImpactSummary } from "../../types/impact-types"

// Os três números institucionais que a associação publica. `updated_at` fica
// null de propósito: a tela só carimba "atualizado em" quando a data vier junto
// com o número, e afirmar atualização sem ela seria inventar precisão.
const SUMMARY: ImpactSummary = {
  stats: [
    { id: "ambulatorio", value: 924, label: "Usuários no Ambulatório", detail: "atendimento clínico e terapêutico" },
    { id: "escola", value: 169, label: "Alunos da Escola", detail: "Escola de Educação Especial" },
    { id: "oficina", value: 145, label: "Usuários da Oficina", detail: "Programa de Oficina Terapêutica" },
  ],
  updated_at: null,
}

export async function getImpactSummary(): Promise<ImpactSummary> {
  return SUMMARY
}
