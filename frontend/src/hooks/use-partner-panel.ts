import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  applyPartner,
  createProposal,
  getPartnerProfile,
  listMyProposals,
  payProposal,
  resubmitPartner,
  withdrawProposal,
} from "../services/partner/partner-service"

// O painel da empresa parceira. Toda ação muda o cadastro, os números e a lista
// de propostas, então tudo que começa com "partner-panel" cai junto.

export function usePartnerProfile() {
  return useQuery({ queryKey: ["partner-panel", "profile"], queryFn: getPartnerProfile })
}

// A lista só é pedida depois de saber que a empresa foi aprovada: antes disso
// não há proposta, e perguntar só gastaria uma requisição.
export function useMyProposals(enabled: boolean) {
  return useQuery({ queryKey: ["partner-panel", "proposals"], queryFn: listMyProposals, enabled })
}

function usePanelMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    retry: false,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["partner-panel"] })
    },
  })
}

export function useCreateProposal() {
  return usePanelMutation(createProposal)
}

export function useWithdrawProposal() {
  return usePanelMutation(withdrawProposal)
}

export function usePayProposal() {
  return usePanelMutation(payProposal)
}

export function useResubmitPartner() {
  return usePanelMutation(resubmitPartner)
}

export function useApplyPartner() {
  return useMutation({ mutationFn: applyPartner, retry: false })
}
