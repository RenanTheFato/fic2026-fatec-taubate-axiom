import axios from "axios"
import { api } from "../../config/api"
import { CheckoutError } from "../../config/errors"
import type { AdminPost, ApiPost, NewsCategory } from "../../types/news-types"

type ListAllPostsResponse = { posts: AdminPost[]; total: number }

// `GET /post/list-all` responde a admin e comunicação e traz o que o site não
// mostra: rascunho e arquivada, com quem escreveu.
export async function listAllPosts(): Promise<AdminPost[]> {
  const { data } = await api.get<ListAllPostsResponse>("/post/list-all", { params: { limit: 50 } })

  return data.posts
}

export type PostInput = {
  title: string
  excerpt: string
  body: string
  category: NewsCategory
  image_url: string | null
}

type PostResponse = { post: ApiPost }

// Escrever cria rascunho; editar não muda o slug, então link compartilhado
// continua funcionando depois de um ajuste de título.
export async function savePost(input: PostInput & { id?: string }): Promise<ApiPost> {
  const { id, ...body } = input

  try {
    const { data } = id
      ? await api.put<PostResponse>(`/post/update/${encodeURIComponent(id)}`, body)
      : await api.post<PostResponse>("/post/create", body)

    return data.post
  } catch (error: unknown) {
    throw refusal(error)
  }
}

export type PostAction = { action: "publish" | "archive"; id: string }

export async function actOnPost({ action, id }: PostAction): Promise<void> {
  try {
    await api.patch(`/post/${action}/${encodeURIComponent(id)}`)
  } catch (error: unknown) {
    throw refusal(error)
  }
}

function refusal(error: unknown): unknown {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data as { error?: string; errors?: { message: string }[] } | undefined

    if (error.response.status === 403) {
      return new CheckoutError("Seu perfil não tem permissão para esta ação.")
    }

    if (error.response.status === 400 || error.response.status === 404) {
      return new CheckoutError(data?.errors?.[0]?.message ?? data?.error ?? "A publicação não pôde ser salva.")
    }
  }

  return error
}
