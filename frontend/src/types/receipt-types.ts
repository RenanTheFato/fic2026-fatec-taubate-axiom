// Espelha a resposta de `GET /receipt/verify/:hash`, que é pública e não exige
// login, porque o hash de 64 caracteres é a própria credencial.
export type ReceiptStatus = "issued" | "cancelled"

export type TransactionType = "donation" | "sponsorship" | "ticket" | "product"

export type VerifiedReceipt = {
  number: string
  sequence: number
  status: ReceiptStatus
  donor_name: string
  /** Já vem mascarado pelo backend. */
  donor_document: string | null
  amount: string
  transaction_type: TransactionType
  issued_at: string
  cancelled_at: string | null
  hash: string
  previous_hash: string | null
}

export type ReceiptVerification = {
  /** O conteúdo bate com o hash e o elo com o recibo anterior está íntegro. */
  authentic: boolean
  /** Autêntico e ainda não cancelado. */
  valid: boolean
  checks: {
    content_matches: boolean
    chain_matches: boolean
  }
  receipt: VerifiedReceipt
}
