// Conteúdo publicado pela associação, vindo de `GET /post/list` e `GET /post/:slug`.
export type NewsCategory = "educacao" | "inclusao" | "saude" | "eventos"

export type NewsStatus = "draft" | "published" | "archived"

// O que a API devolve. O corpo chega como texto corrido, com uma linha em branco
// entre parágrafos, e a imagem como caminho: as duas coisas são convertidas uma
// vez, no serviço, para a forma que as telas usam.
export type ApiPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  body: string
  category: NewsCategory
  image_url: string | null
  status: NewsStatus
  published_at: string | null
  created_at: string
  updated_at: string
}

export type NewsPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  category: NewsCategory
  published_at: string
  /** Caminho da imagem em `public/imagens/`, como gravado no banco. */
  image: string | null
  /** Corpo da publicação, um parágrafo por item. */
  body: string[]
}

// A linha do painel de Comunicação: inclui rascunho e arquivada, e quem escreveu.
export type AdminPost = ApiPost & {
  author: { id: string; name: string } | null
}
