import { useQuery } from "@tanstack/react-query"
import { listLatestNews } from "../services/news/list-latest-news-service"

export function useLatestNews(limit = 3) {
  return useQuery({
    queryKey: ["news", "latest", limit],
    queryFn: () => listLatestNews(limit),
  })
}
