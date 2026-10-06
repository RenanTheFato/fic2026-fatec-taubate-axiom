import axios from "axios"
import { api } from "../../config/api"
import { NotFoundError } from "../../config/errors"
import type { ApiPost, NewsPost } from "../../types/news-types"
import { toNewsPost } from "./list-news-service"

type GetPostResponse = {
  post: ApiPost
}

// O 404 vira erro de domínio, como no evento e no produto: "não existe essa
// publicação" é resposta legítima (rascunho e arquivada respondem igual), e a
// tela decide por `instanceof` em vez de procurar texto dentro da mensagem.
export async function getPostBySlug(slug: string): Promise<NewsPost> {
  try {
    const { data } = await api.get<GetPostResponse>(`/post/${encodeURIComponent(slug)}`)

    return toNewsPost(data.post)
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new NotFoundError("Publicação não encontrada")
    }

    throw error
  }
}
