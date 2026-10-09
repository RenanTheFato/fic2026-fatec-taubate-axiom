import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { actOnPost, listAllPosts, savePost } from "../services/admin/posts-service"

export function useAllPosts(enabled = true) {
  return useQuery({ queryKey: ["news", "all"], queryFn: listAllPosts, enabled })
}

// Publicar, arquivar ou editar muda o que o site mostra, então o cache das
// listagens públicas de notícia cai junto com o do painel.
function useNewsMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["news"] })
    },
  })
}

export function useSavePost() {
  return useNewsMutation(savePost)
}

export function usePostAction() {
  return useNewsMutation(actOnPost)
}
