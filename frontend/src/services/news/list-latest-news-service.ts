import type { NewsPost } from "../../types/news-types"
import { listNews } from "./list-news-service"

// O recorte que a home mostra. Fica separado da listagem completa porque é outra
// pergunta: a home quer as últimas, a página de notícias quer o acervo. O
// recorte é pedido à API, e não feito sobre o acervo inteiro.
export async function listLatestNews(limit = 3): Promise<NewsPost[]> {
  return await listNews(undefined, limit)
}
