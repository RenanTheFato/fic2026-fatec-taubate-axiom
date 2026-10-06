import type { BadgeTone } from "../ui/badge"
import type { NewsCategory } from "../../types/news-types"

// O rótulo em português e a cor de cada assunto ficam em um lugar só: o cartão
// da home, a listagem e a página da publicação precisam dizer a mesma coisa,
// pela mesma razão que os rótulos de transação moram em `admin/transaction-labels`.
export const CATEGORY_LABEL: Record<NewsCategory, { label: string; tone: BadgeTone }> = {
  educacao: { label: "Educação", tone: "institutional" },
  inclusao: { label: "Inclusão", tone: "partner" },
  saude: { label: "Saúde", tone: "success" },
  eventos: { label: "Eventos", tone: "primary" },
}
