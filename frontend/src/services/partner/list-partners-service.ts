import type { Partner } from "../../types/partner-types"

// Os 14 parceiros que a ONG exibe no site atual. Enquanto não houver cadastro
// no backend, a lista é fixa — mas continua sendo uma lista, com um item e um
// nome acessível por parceiro, nunca uma imagem única de logos.
//
// Para colocar o logo de um parceiro: salve o arquivo em
// `public/parceiros/<slug>.png` (fundo transparente, altura mínima de 96px) e
// troque o `null` pelo caminho. Sem arquivo, o card mostra o nome, que é uma
// saída digna — logo quebrado não é.
const PARTNERS: Partner[] = [
  { name: "Beatz", logo: null, site: null },
  { name: "Asstam", logo: null, site: null },
  { name: "Cobreq", logo: null, site: null },
  { name: "Dayco", logo: null, site: null },
  { name: "GTA", logo: null, site: null },
  { name: "Haoc Saúde", logo: null, site: null },
  { name: "Leonardi", logo: null, site: null },
  { name: "Lofts", logo: null, site: null },
  { name: "Lógica", logo: null, site: null },
  { name: "Mann + Hummel", logo: null, site: null },
  { name: "Monark", logo: null, site: null },
  { name: "Sew Eurodrive", logo: null, site: null },
  { name: "V&S", logo: null, site: null },
  { name: "Power Fiber", logo: null, site: null },
].map((partner, index) => ({ id: String(index + 1), ...partner }))

export async function listPartners(): Promise<Partner[]> {
  return PARTNERS
}
