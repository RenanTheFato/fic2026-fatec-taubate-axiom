import { api } from "../../config/api"
import type { Partner } from "../../types/partner-types"

type ListPartnersResponse = { partners: Partner[] }

// A rede de parceiros da página pública: as empresas aprovadas que autorizaram
// a marca no site, em ordem alfabética. A lista é uma lista, com um item e um
// nome acessível por parceiro, nunca uma imagem única com todos os logos.
export async function listPartners(): Promise<Partner[]> {
  const { data } = await api.get<ListPartnersResponse>("/partner/list")

  return data.partners
}
