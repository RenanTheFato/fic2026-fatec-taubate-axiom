// O domínio de blog ainda não existe no backend (ver goals.md, "Dependência do
// backend"). O tipo já é o definitivo: quando a rota nascer, só a função em
// services/news muda.
export type NewsCategory = "educacao" | "inclusao" | "saude" | "eventos"

export type NewsPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  category: NewsCategory
  published_at: string
  /** Caminho da imagem em `public/imagens/noticias/`. `null` enquanto não existir. */
  image: string | null
}
