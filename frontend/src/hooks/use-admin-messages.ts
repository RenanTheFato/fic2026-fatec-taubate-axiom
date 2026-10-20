import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { listMessages, resolveMessage, withdrawFromWall } from "../services/admin/messages-service"
import type { ContactFilters } from "../types/contact-types"

export function useMessages(filters: ContactFilters) {
  return useQuery({
    queryKey: ["messages", "list", filters],
    queryFn: () => listMessages(filters),
    placeholderData: keepPreviousData,
  })
}

function useMessageMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>, alsoInvalidate?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    retry: false,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["messages"] })

      if (alsoInvalidate) await queryClient.invalidateQueries({ queryKey: [alsoInvalidate] })
    },
  })
}

export function useResolveMessage() {
  return useMessageMutation(resolveMessage)
}

// Retirar do mural muda o que o site mostra no Mural do Bem, então o cache dele
// cai junto com o da caixa de entrada.
export function useWithdrawFromWall() {
  return useMessageMutation(withdrawFromWall, "supporters")
}
