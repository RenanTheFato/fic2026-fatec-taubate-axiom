import type { ImpactSummary } from "../../types/impact-types"

// PROVISÓRIO — o Painel de Impacto ainda não tem rota. Os três números são os
// que a ONG publica hoje no próprio site, então continuam verdadeiros; o que
// falta é serem vivos. `updated_at` fica null de propósito: a tela não pode
// afirmar "atualizado agora" sobre um dado que não veio da API.
const PLACEHOLDER: ImpactSummary = {
  stats: [
    { id: "ambulatorio", value: 924, label: "Usuários no Ambulatório", detail: "atendimento clínico e terapêutico" },
    { id: "escola", value: 169, label: "Alunos da Escola", detail: "Escola de Educação Especial" },
    { id: "oficina", value: 145, label: "Usuários da Oficina", detail: "Programa de Oficina Terapêutica" },
  ],
  updated_at: null,
}

export async function getImpactSummary(): Promise<ImpactSummary> {
  return PLACEHOLDER
}
