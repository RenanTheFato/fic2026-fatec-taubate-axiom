import { api } from "../../config/api"
import type { Transaction, TransactionStatus, TransactionType } from "../../types/transaction-types"

// `GET /transaction/list` traz doador, campanha e evento junto, para a tabela
// não precisar de uma requisição por linha.
export type AdminTransaction = Transaction & {
  donor: { id: string; name: string; email: string } | null
  campaign: { id: string; title: string; slug: string } | null
  event: { id: string; title: string; slug: string } | null
}

export type TransactionFilters = {
  status?: TransactionStatus
  type?: TransactionType
  campaign_id?: string
  from?: string
  to?: string
  page?: number
}

type ListTransactionsResponse = {
  transactions: AdminTransaction[]
  total: number
}

export const PAGE_SIZE = 20

export async function listTransactions(filters: TransactionFilters = {}) {
  const { data } = await api.get<ListTransactionsResponse>("/transaction/list", {
    params: {
      limit: PAGE_SIZE,
      page: filters.page ?? 1,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.campaign_id ? { campaign_id: filters.campaign_id } : {}),
      ...(filters.from ? { from: filters.from } : {}),
      ...(filters.to ? { to: filters.to } : {}),
    },
  })

  return { transactions: data.transactions, total: data.total }
}

// A rota devolve **linhas, não somas** (`backend/corrections.md`, item G).
// Somar aqui é legítimo desde que a tela diga o que está somando: é o total da
// página exibida, e não o relatório financeiro do período. Chamar isso de
// "arrecadação" seria mentir sobre o escopo do número.
export function sumConfirmed(transactions: AdminTransaction[]): string {
  const cents = transactions
    .filter((transaction) => transaction.status === "confirmed")
    .reduce((total, transaction) => total + Math.round(Number(transaction.amount) * 100), 0)

  return (cents / 100).toFixed(2)
}
