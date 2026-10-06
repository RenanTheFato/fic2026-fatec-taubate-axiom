import { useQuery } from "@tanstack/react-query"
import { getPostBySlug } from "../services/news/get-post-by-slug-service"

export function usePost(slug: string | undefined) {
  return useQuery({
    queryKey: ["news", "post", slug],
    queryFn: () => getPostBySlug(slug as string),
    enabled: Boolean(slug),
    retry: false,
  })
}
