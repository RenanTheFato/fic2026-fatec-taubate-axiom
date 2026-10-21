import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { cancelRegistration, checkIn, listRegistrations, undoCheckIn } from "../services/admin/registrations-service"

export function useEventRegistrations(eventId: string) {
  return useQuery({
    queryKey: ["registrations", eventId],
    queryFn: () => listRegistrations(eventId),
    enabled: eventId.length > 0,
  })
}

// Toda mudança recarrega a lista, deu certo ou não: uma recusa aqui quase sempre
// é outra porta mexendo no mesmo ingresso, e a lista precisa mostrar isso.
// Cancelar devolve vaga, então a agenda do painel e a do site caem junto.
function useRegistrationMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    retry: false,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["registrations"] })
      await queryClient.invalidateQueries({ queryKey: ["tickets"] })
      await queryClient.invalidateQueries({ queryKey: ["events"] })
    },
  })
}

export function useCheckIn() {
  return useRegistrationMutation(checkIn)
}

export function useUndoCheckIn() {
  return useRegistrationMutation(undoCheckIn)
}

export function useCancelRegistration() {
  return useRegistrationMutation(cancelRegistration)
}
