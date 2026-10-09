import type { ImpactPanel } from "../../types/impact-types"
import { getImpactSummary } from "./get-impact-summary-service"

// Os números por programa são os que a associação publica. Enquanto o painel não
// tem rota própria na API, eles moram aqui, isolados da tela: quando a rota
// existir, só esta função muda.
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
  }
}
