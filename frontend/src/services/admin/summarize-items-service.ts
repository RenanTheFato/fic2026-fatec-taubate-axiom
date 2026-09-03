import { api } from "../../config/api"

export type ItemSummaryLine = {
  product_id: string | null
  description: string
  quantity: number
  revenue: string
  transactions: number
}

export type ItemSummaryTotals = {
  products: number
  quantity: number
  revenue: string
  transactions: number
}

type SummaryResponse = {
  summary: ItemSummaryLine[]
  totals: ItemSummaryTotals
}

// Diferente de `GET /transaction/list`, esta rota **já vem agregada pelo SQL**:
// o total é do banco inteiro, não da página, e por isso pode ser apresentado
// como número do período em vez de "soma do que está na tela".
export async function summarizeItems() {
  const { data } = await api.get<SummaryResponse>("/transaction-item/summary")

  return { summary: data.summary, totals: data.totals }
}
