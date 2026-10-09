import { useInfiniteQuery } from "@tanstack/react-query"
import { listSupporters } from "../services/supporter/list-supporters-service"
import type { SupporterScope } from "../types/supporter-types"

type SupporterCursor = { page: number; seed: string | null }

function scopeKey(scope: SupporterScope): string {
  return scope.kind === "site" ? "site" : `${scope.kind}:${scope.slug}`
}

// Paginação por "carregar mais", carregando junto a semente da ordem. A
// primeira página sorteia; as próximas pedem a mesma semente, então a lista
// cresce sem repetir ninguém. `staleTime: Infinity` porque trocar a ordem
// enquanto a pessoa lê seria embaralhar o mural na frente dela.
export function useSupporters(scope: SupporterScope) {
  return useInfiniteQuery({
    queryKey: ["supporters", scopeKey(scope)],
    queryFn: ({ pageParam }) => listSupporters(scope, pageParam.page, pageParam.seed),
    initialPageParam: { page: 1, seed: null } as SupporterCursor,
    getNextPageParam: (last, pages): SupporterCursor | undefined => {
      const loaded = pages.reduce((count, page) => count + page.supporters.length, 0)

      return loaded < last.total && last.supporters.length > 0 ? { page: pages.length + 1, seed: last.seed } : undefined
    },
    staleTime: Infinity,
    retry: false,
  })
}
