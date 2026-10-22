// Espelha os domínios `partner` e `partner-proposal` do backend: a empresa pede
// para entrar na rede pelo site, a associação aprova ou recusa, e a empresa
// aprovada sugere campanhas, aportes e patrocínios pelo próprio painel.

/** A empresa na rede pública da página de parceiros: só nome, logo e site. */
export type Partner = {
  id: string
  name: string
  /** Caminho ou endereço do logo. `null` enquanto o arquivo não existe. */
  logo: string | null
  site: string | null
}

export type PartnerInterest = "sponsorship" | "contribution" | "in_kind" | "volunteering" | "institutional"

export type PartnerStatus = "pending" | "approved" | "refused"

export type PartnerAccount = {
  id: string
  user_id: string | null
  company_name: string
  document: string | null
  phone: string | null
  website: string | null
  logo_url: string | null
  interests: PartnerInterest[]
  message: string | null
  public_listing: boolean
  status: PartnerStatus
  review_note: string | null
  reviewed_at: string | null
  created_at: string
}

export type ProposalKind = "campaign" | "contribution" | "sponsorship" | "in_kind" | "volunteering"

export type ProposalStatus = "pending" | "accepted" | "refused" | "withdrawn"

/** O painel da empresa: o cadastro e os números do retorno. */
export type PartnerProfile = PartnerAccount & {
  user: { id: string; name: string; email: string }
  summary: {
    proposals: Record<ProposalStatus, number>
    /** Soma dos pagamentos confirmados, DECIMAL como string. */
    contributed: string
    contributions: number
  }
}

/** Um pedido de parceria como a associação o lê no painel. */
export type PartnerApplication = PartnerAccount & {
  user: { id: string; name: string; email: string } | null
  reviewer: { id: string; name: string } | null
}

export type PartnerApplicationPage = {
  partners: PartnerApplication[]
  total: number
  /** Pedidos em análise, qualquer que seja o filtro. */
  pending: number
}

export type ProposalTarget = { id: string; title: string; slug: string } | null

export type TransactionStatusName = "pending" | "awaiting_confirmation" | "confirmed" | "refused" | "cancelled" | "refunded"

type ProposalBase = {
  id: string
  partner_id: string
  kind: ProposalKind
  title: string
  description: string
  amount: string | null
  campaign_id: string | null
  event_id: string | null
  status: ProposalStatus
  response_note: string | null
  reviewed_at: string | null
  created_at: string
  campaign: ProposalTarget
  event: ProposalTarget
}

/** A proposta como a própria empresa a vê, com o pagamento e o recibo. */
export type MyProposal = ProposalBase & {
  payment: {
    transaction_id: string
    status: TransactionStatusName
    amount: string
    receipt: { number: string; hash: string; status: "issued" | "cancelled" } | null
  } | null
}

/** A proposta como a associação a vê, com a empresa e o pagamento. */
export type AdminProposal = ProposalBase & {
  transaction_id: string | null
  partner: {
    id: string
    company_name: string
    phone: string | null
    user: { id: string; name: string; email: string } | null
  }
  transaction: { id: string; status: TransactionStatusName; amount: string } | null
  reviewer: { id: string; name: string } | null
}

export type AdminProposalPage = {
  proposals: AdminProposal[]
  total: number
  pending: number
}

export type PartnerApplicationInput = {
  company_name: string
  document: string
  phone: string
  website: string | null
  interests: PartnerInterest[]
  message: string
  public_listing: boolean
  name: string
  email: string
  password: string
}

export type ProposalInput = {
  kind: ProposalKind
  title: string
  description: string
  amount: number | null
  campaign_id: string | null
  event_id: string | null
}

export type ReviewInput = {
  id: string
  note: string | null
}
