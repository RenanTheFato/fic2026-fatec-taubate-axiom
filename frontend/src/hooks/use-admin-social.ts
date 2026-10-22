import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  deleteSocialPost,
  importInstagramPosts,
  listAllSocialPosts,
  saveSocialPost,
  setSocialPostVisibility,
} from "../services/admin/social-service"

export function useAllSocialPosts() {
  return useQuery({ queryKey: ["social", "all"], queryFn: listAllSocialPosts })
}

// Mexer numa publicação muda o que a página de redes sociais e a home mostram,
// então o cache público cai junto com o do painel.
function useSocialMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    retry: false,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["social"] })
    },
  })
}

export function useSaveSocialPost() {
  return useSocialMutation(saveSocialPost)
}

export function useSocialPostVisibility() {
  return useSocialMutation(setSocialPostVisibility)
}

export function useDeleteSocialPost() {
  return useSocialMutation(deleteSocialPost)
}

export function useImportInstagram() {
  return useSocialMutation(importInstagramPosts)
}
