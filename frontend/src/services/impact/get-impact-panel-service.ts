import type { ImpactPanel } from "../../types/impact-types"
import { getImpactSummary } from "./get-impact-summary-service"

// PROVISÓRIO: o Painel de Impacto não tem rota no backend. Os números por
// programa são os que a ONG publica hoje; o que ainda não existe está declarado
// em `pending`, e a tela mostra essa lista em vez de fingir que o dado é vivo.
export async function getImpactPanel(): Promise<ImpactPanel> {
  const summary = await getImpactSummary()

  return {
    summary,
    programs: [
      {
        id: "ambulatorio",
        name: "Ambulatório",
        description:
          "Atendimento clínico, terapêutico e de reabilitação para pessoas com Deficiência Intelectual e/ou Múltipla.",
        people: 924,
        turns_into: "consultas, terapias e acompanhamento contínuo",
      },
      {
        id: "escola",
        name: "Escola de Educação Especial",
        description: "Ensino adaptado ao ritmo de cada estudante, em parceria com a família.",
        people: 169,
        turns_into: "material pedagógico, transporte e equipe docente",
      },
      {
        id: "oficina",
        name: "Programa de Oficina Terapêutica",
        description: "Autonomia, convivência e trabalho protegido para jovens e adultos.",
        people: 145,
        turns_into: "insumos das oficinas e acompanhamento profissional",
      },
    ],
    pending: [
      "Arrecadação do mês, atualizada a cada doação confirmada",
      "Voluntários ativos e horas doadas no período",
      "Percentual de cada real aplicado diretamente nos programas",
      "Metas das campanhas em andamento",
    ],
  }
}
