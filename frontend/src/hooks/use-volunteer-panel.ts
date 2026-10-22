import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  applyVolunteer,
  getVolunteerProfile,
  joinShift,
  leaveShift,
  listMyShifts,
  listOpenShifts,
  resubmitVolunteer,
} from "../services/volunteer/volunteer-service"

// O painel de quem doa tempo. Entrar ou sair de um turno muda a escala, os
// turnos abertos e o número de próximos turnos: tudo que começa com
// "volunteer-panel" cai junto.

export function useVolunteerProfile() {
  return useQuery({ queryKey: ["volunteer-panel", "profile"], queryFn: getVolunteerProfile, retry: false })
}

export function useMyShifts(enabled: boolean) {
  return useQuery({ queryKey: ["volunteer-panel", "mine"], queryFn: listMyShifts, enabled })
}

// Só o cadastro aprovado vê os turnos abertos: a tela só pergunta nesse caso,
// para um 403 nunca aparecer como "não carregou".
export function useOpenShifts(enabled: boolean) {
  return useQuery({ queryKey: ["volunteer-panel", "open"], queryFn: listOpenShifts, enabled })
}

function usePanelMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    retry: false,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["volunteer-panel"] })
    },
  })
}

export function useJoinShift() {
  return usePanelMutation(joinShift)
}

export function useLeaveShift() {
  return usePanelMutation(leaveShift)
}

export function useResubmitVolunteer() {
  return usePanelMutation(resubmitVolunteer)
}

export function useApplyVolunteer() {
  return useMutation({ mutationFn: applyVolunteer, retry: false })
}
