import { api } from "../../config/api"
import type { ApiPost, NewsCategory, NewsPost } from "../../types/news-types"

type ListPostsResponse = {
  posts: ApiPost[]
  total: number
}

// A tradução da forma da API para a forma das telas mora aqui e em nenhum outro
// lugar: o corpo vira lista de parágrafos e `image_url` vira `image`. A lista,
// o card da home e a página da notícia leem o mesmo `NewsPost`.
export function toNewsPost(post: ApiPost): NewsPost {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    category: post.category,
    published_at: post.published_at ?? post.created_at,
    image: post.image_url,
    body: post.body.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean),
  }
}

// `GET /post/list` é público, traz só o que está publicado e já vem da mais
// recente para a mais antiga. O acervo inteiro cabe numa página de 50, então o
// filtro por assunto continua sendo estado de tela sobre a lista em mãos.
export async function listNews(category?: NewsCategory, limit = 50): Promise<NewsPost[]> {
  const { data } = await api.get<ListPostsResponse>("/post/list", {
    params: { limit, ...(category ? { category } : {}) },
  })

  return data.posts.map(toNewsPost)
}

// As abas da listagem saem daqui, e não de uma lista fixa de categorias: uma aba
// que nunca tem publicação só ensina o visitante a encontrar tela vazia.
export function categoriesInUse(posts: NewsPost[]): NewsCategory[] {
  const seen = new Set<NewsCategory>()

  for (const post of posts) {
    seen.add(post.category)
  }

  return [...seen]
}

export function relatedPosts(posts: NewsPost[], current: NewsPost, limit = 2): NewsPost[] {
  const sameCategory = posts.filter(
    (post) => post.id !== current.id && post.category === current.category,
  )
  const rest = posts.filter((post) => post.id !== current.id && post.category !== current.category)

  return [...sameCategory, ...rest].slice(0, limit)
}
