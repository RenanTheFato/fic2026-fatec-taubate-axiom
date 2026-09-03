import { api } from "../../config/api"
import type { TransactionType } from "../../types/transaction-types"

export type AdminReceipt = {
  id: string
  transaction_id: string
  sequence: number
  number: string
  status: "issued" | "cancelled"
  donor_name: string
  donor_document: string | null
  amount: string
  transaction_type: TransactionType
  issued_at: string
  cancelled_at: string | null
  previous_hash: string | null
  hash: string
}

type ListReceiptsResponse = {
  receipts: AdminReceipt[]
  total: number
}

// A listagem vem da maior sequence para a menor, que é a ordem em que a corrente
// foi emitida, de trás para a frente.
export async function listReceipts(page = 1) {
  const { data } = await api.get<ListReceiptsResponse>("/receipt/list", {
    params: { limit: 20, page },
  })

  return { receipts: data.receipts, total: data.total }
}
