import { useQuery } from "@tanstack/react-query"
import { listNews } from "../services/news/list-news-service"
import type { NewsCategory } from "../types/news-types"

export function useNews(category?: NewsCategory) {
  return useQuery({
    queryKey: ["news", "list", category ?? "todas"],
    queryFn: () => listNews(category),
  })
}
