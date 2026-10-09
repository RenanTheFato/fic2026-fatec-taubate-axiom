import axios from "axios"
import { api } from "../../config/api"
import { NotFoundError } from "../../config/errors"
import type { SupporterPage, SupporterScope } from "../../types/supporter-types"

export const SUPPORTERS_PER_PAGE = 120

function pathFor(scope: SupporterScope): string {
  if (scope.kind === "campaign") return `/supporter/campaign/${encodeURIComponent(scope.slug)}`
  if (scope.kind === "event") return `/supporter/event/${encodeURIComponent(scope.slug)}`

  return "/supporter/list"
}

// O mural é público e embaralhado no servidor. A primeira página vai sem
// semente e a API sorteia uma; as seguintes repetem a que voltou, e é isso que
// deixa a ordem aleatória e ainda assim paginável sem repetir nem pular nome.
// Uma visita nova começa sem semente, então cada visita vê outra ordem.
export async function listSupporters(scope: SupporterScope, page: number, seed: string | null): Promise<SupporterPage> {
  try {
    const { data } = await api.get<SupporterPage>(pathFor(scope), {
      params: { page, limit: SUPPORTERS_PER_PAGE, ...(seed ? { seed } : {}) },
    })

    return {
      supporters: data.supporters,
      total: data.total,
      contributors: data.contributors,
      seed: data.seed,
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new NotFoundError("Mural não encontrado")
    }

    throw error
  }
}
