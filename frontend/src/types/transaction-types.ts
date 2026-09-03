// Espelha TransactionInterface do backend. `amount` é DECIMAL, ou seja, string.
export type TransactionType = "donation" | "sponsorship" | "ticket" | "product"

export type TransactionStatus =
  | "pending"
  | "awaiting_confirmation"
  | "confirmed"
  | "refused"
  | "cancelled"
  | "refunded"

export type PaymentMethod = "pix" | "credit_card" | "debit_card" | "boleto" | "manual_pix"

export type Transaction = {
  id: string
  type: TransactionType
  status: TransactionStatus
  amount: string
  payment_method: PaymentMethod | null
  donor_id: string
  campaign_id: string | null
  event_id: string | null
  gateway_checkout_id: string | null
  gateway_payment_id: string | null
  checkout_url: string | null
  notes: string | null
  confirmed_at: string | null
  refunded_at: string | null
  created_at: string
  updated_at: string
}

// O que a rota pública de acompanhamento devolve. É de propósito mais magra que
// `Transaction`: dado pessoal de doador não sai por rota sem login.
export type TransactionStatusView = {
  id: string
  type: TransactionType
  status: TransactionStatus
  amount: string
  payment_method: PaymentMethod | null
  confirmed_at: string | null
  created_at: string
  /** Só existe depois de `confirmed`: antes disso não há documento nenhum. */
  receipt_hash: string | null
  receipt_number: string | null
}

// O corpo de `POST /transaction/create`. Doação e patrocínio mandam `amount`;
// convite e produto **não podem** mandar: o preço vem do catálogo e o backend
// responde 400 a um valor enviado, que é a proteção contra comprar por um
// centavo.
export type CreateTransactionInput = {
  type: TransactionType
  amount?: number
  items?: { product_id: string; quantity?: number }[]
  campaign_id?: string | null
  event_id?: string | null
  notes?: string | null
  donor_name: string
  donor_email: string
  donor_document?: string | null
  donor_phone?: string | null
}
