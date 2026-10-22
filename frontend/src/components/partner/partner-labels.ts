import { CalendarHeart, HandCoins, HandHeart, Megaphone, Package } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { PartnerInterest, PartnerStatus, ProposalKind, ProposalStatus, TransactionStatusName } from "../../types/partner-types"
import type { BadgeTone } from "../ui/badge"

// A palavra e o selo de cada situação da parceria, no mesmo lugar para o pedido,
// o painel da empresa e o painel da associação dizerem a mesma coisa.

export const INTEREST_LABEL: Record<PartnerInterest, string> = {
  sponsorship: "Patrocínio de eventos",
  contribution: "Aporte em dinheiro",
  in_kind: "Doação de produtos e serviços",
  volunteering: "Voluntariado corporativo",
  institutional: "Apoio institucional",
}

export const PARTNER_STATUS: Record<PartnerStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Em análise", tone: "reward" },
  approved: { label: "Aprovada", tone: "success" },
  refused: { label: "Recusada", tone: "primary" },
}

export const PROPOSAL_KIND: Record<ProposalKind, { label: string; icon: LucideIcon }> = {
  campaign: { label: "Sugestão de campanha", icon: Megaphone },
  contribution: { label: "Aporte", icon: HandCoins },
  sponsorship: { label: "Patrocínio", icon: CalendarHeart },
  in_kind: { label: "Produtos e serviços", icon: Package },
  volunteering: { label: "Voluntariado da equipe", icon: HandHeart },
}

export const PROPOSAL_STATUS: Record<ProposalStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Em análise", tone: "reward" },
  accepted: { label: "Aceita", tone: "success" },
  refused: { label: "Recusada", tone: "primary" },
  withdrawn: { label: "Retirada", tone: "institutional" },
}

// A situação do pagamento de um aporte aceito, contada a partir da transação.
export const PAYMENT_STATUS: Record<TransactionStatusName, { label: string; tone: BadgeTone }> = {
  pending: { label: "Aguardando pagamento", tone: "reward" },
  awaiting_confirmation: { label: "Pagamento em processamento", tone: "reward" },
  confirmed: { label: "Pago", tone: "success" },
  refused: { label: "Pagamento recusado", tone: "primary" },
  cancelled: { label: "Pagamento não concluído", tone: "institutional" },
  refunded: { label: "Estornado", tone: "institutional" },
}

/** As propostas que viram pagamento pelo site depois de aceitas. */
export const PAYABLE_KINDS: readonly ProposalKind[] = ["contribution", "sponsorship"]

/** "11.222.333/0001-81". */
export function formatCnpj(document: string | null): string | null {
  if (!document) return null

  const digits = document.replace(/\D/g, "")

  if (digits.length !== 14) return document

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

/** O mesmo cálculo dos dígitos verificadores que o backend faz, para avisar antes de enviar. */
export function isValidCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, "")

  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false

  function check(length: number): number {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const sum = weights.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0)
    const rest = sum % 11

    return rest < 2 ? 0 : 11 - rest
  }

  return check(12) === Number(digits[12]) && check(13) === Number(digits[13])
}
