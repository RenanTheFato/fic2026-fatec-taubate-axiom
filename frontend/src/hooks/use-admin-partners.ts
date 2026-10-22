import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { listPartnerApplications, listPartnerProposals, reviewPartner, reviewProposal } from "../services/admin/partners-service"
import type { PartnerStatus, ProposalKind, ProposalStatus } from "../types/partner-types"

export function usePartnerApplications(filters: { status: PartnerStatus | null; page: number }, enabled = true) {
  return useQuery({
    queryKey: ["partners", "applications", filters],
    queryFn: () => listPartnerApplications(filters),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function usePartnerProposals(filters: { status: ProposalStatus | null; kind: ProposalKind | null; page: number }, enabled = true) {
  return useQuery({
    queryKey: ["partners", "proposals", filters],
    queryFn: () => listPartnerProposals(filters),
    placeholderData: keepPreviousData,
    enabled,
  })
}

// Aprovar uma empresa muda a rede pública da página de parceiros, então a
// listagem pública cai junto com a do painel.
export function useReviewPartner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reviewPartner,
    retry: false,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["partners"] })
    },
  })
}

export function useReviewProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reviewProposal,
    retry: false,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["partners", "proposals"] })
    },
  })
}
