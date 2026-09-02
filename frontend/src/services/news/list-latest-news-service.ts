import type { NewsPost } from "../../types/news-types"

// PROVISÓRIO — não existe domínio de blog no backend (ver goals.md). Os três
// posts abaixo são os que estão publicados no site atual da ONG.
const PLACEHOLDER: NewsPost[] = [
  {
    id: "1",
    title: "Chocolate do Bem: uma Páscoa de solidariedade",
    slug: "chocolate-do-bem-uma-pascoa-de-solidariedade",
    excerpt:
      "Na Páscoa deste ano, a solidariedade foi o ingrediente principal da campanha organizada pela associação Somos do Bem.",
    category: "eventos",
    published_at: "2024-12-11T12:00:00.000Z",
    image: null, // "/imagens/noticias/chocolate-do-bem.jpg"
  },
  {
    id: "2",
    title: "5ª edição do Chefs do Bem",
    slug: "5a-edicao-do-chefs-do-bem",
    excerpt:
      "Realizada nos dias 23, 24 e 25 de agosto, no Espaço Viber, em Indaiatuba, a edição foi um grande sucesso.",
    category: "eventos",
    published_at: "2024-11-25T12:00:00.000Z",
    image: null, // "/imagens/noticias/5a-edicao-do-chefs-do-bem.jpg"
  },
  {
    id: "3",
    title: "Mudança de nome da APAE de Indaiatuba",
    slug: "mudanca-de-nome-da-apae-de-indaiatuba",
    excerpt:
      "A instituição realizou uma coletiva de imprensa para anunciar seu novo nome e sua nova marca: Somos do Bem.",
    category: "inclusao",
    published_at: "2024-11-25T12:00:00.000Z",
    image: null, // "/imagens/noticias/mudanca-de-nome.jpg"
  },
]

export async function listLatestNews(limit = 3): Promise<NewsPost[]> {
  return PLACEHOLDER.slice(0, limit)
}
