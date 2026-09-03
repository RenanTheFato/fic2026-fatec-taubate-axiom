import type { BadgeTone } from "../ui/badge"
import type { TransactionStatus, TransactionType } from "../../types/transaction-types"

// Tradução dos enums do backend para leitura. Os valores continuam sendo os da
// API, e traduzir só na tela evita duas verdades sobre a mesma coluna.

export const STATUS_TONE: Record<TransactionStatus, BadgeTone> = {
  pending: "alert",
  awaiting_confirmation: "alert",
  confirmed: "success",
  refused: "primary",
  cancelled: "primary",
  refunded: "institutional",
}

export const STATUS_LABEL: Record<TransactionStatus, string> = {
  pending: "Pendente",
  awaiting_confirmation: "Aguardando",
  confirmed: "Confirmada",
  refused: "Recusada",
  cancelled: "Cancelada",
  refunded: "Estornada",
}

export const TYPE_LABEL: Record<TransactionType, string> = {
  donation: "Doação",
  sponsorship: "Patrocínio",
  ticket: "Convite",
  product: "Produto",
}
