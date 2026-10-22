import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { listSocialPosts } from "../services/social/list-social-posts-service"
import type { SocialNetwork } from "../types/social-types"

export function useSocialPosts(filters: { network: SocialNetwork | null; page: number; limit?: number }) {
  return useQuery({
    queryKey: ["social", "list", filters],
    queryFn: () => listSocialPosts(filters),
    placeholderData: keepPreviousData,
  })
}
