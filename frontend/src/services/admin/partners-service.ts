import axios from "axios"
import { api } from "../../config/api"
import { CheckoutError } from "../../config/errors"
import type {
  AdminProposalPage,
  PartnerApplicationPage,
  PartnerStatus,
  ProposalKind,
  ProposalStatus,
} from "../../types/partner-types"

export const PARTNERS_PER_PAGE = 20

// O lado da associação: os pedidos de parceria e as propostas das empresas.
// Responde a admin e comunicação, que cuida da captação.

export async function listPartnerApplications({ status, page }: { status: PartnerStatus | null; page: number }): Promise<PartnerApplicationPage> {
  const { data } = await api.get<PartnerApplicationPage>("/partner/list-applications", {
    params: { page, limit: PARTNERS_PER_PAGE, ...(status ? { status } : {}) },
  })

  return { partners: data.partners, total: data.total, pending: data.pending }
}

export async function reviewPartner({ id, decision, note }: { id: string; decision: "approved" | "refused"; note: string | null }): Promise<void> {
  try {
    await api.patch(`/partner/review/${encodeURIComponent(id)}`, { decision, note })
  } catch (error: unknown) {
    throw refusal(error, "O pedido não pôde ser respondido.")
  }
}

export async function listPartnerProposals({ status, kind, page }: { status: ProposalStatus | null; kind: ProposalKind | null; page: number }): Promise<AdminProposalPage> {
  const { data } = await api.get<AdminProposalPage>("/partner-proposal/list", {
    params: { page, limit: PARTNERS_PER_PAGE, ...(status ? { status } : {}), ...(kind ? { kind } : {}) },
  })

  return { proposals: data.proposals, total: data.total, pending: data.pending }
}

export async function reviewProposal({ id, decision, note }: { id: string; decision: "accepted" | "refused"; note: string }): Promise<void> {
  try {
    await api.patch(`/partner-proposal/review/${encodeURIComponent(id)}`, { decision, note })
  } catch (error: unknown) {
    throw refusal(error, "A proposta não pôde ser respondida.")
  }
}

const REFUSALS: Record<string, string> = {
  "This request has already been reviewed": "Alguém da equipe já respondeu este pedido. Recarregue a lista.",
  "This proposal has already been answered": "Alguém da equipe já respondeu esta proposta. Recarregue a lista.",
}

function refusal(error: unknown, fallback: string): unknown {
  if (axios.isAxiosError(error) && error.response && (error.response.status === 400 || error.response.status === 404)) {
    const data = error.response.data as { error?: string } | undefined

    return new CheckoutError((data?.error && REFUSALS[data.error]) || fallback)
  }

  return error
}
