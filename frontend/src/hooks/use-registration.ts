import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createRegistration, getTicket } from "../services/registration/registration-service"

// Depois de uma inscrição (ou de uma recusa), a página do evento volta a
// perguntar quantas vagas restam: é assim que um "esgotado" aparece para quem
// chegou atrasado sem a tela precisar adivinhar o motivo da recusa.
export function useCreateRegistration(slug: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createRegistration,
    retry: false,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["events", "detail", slug] })
    },
  })
}

export function useTicket(code: string) {
  return useQuery({
    queryKey: ["tickets", code],
    queryFn: () => getTicket(code),
    enabled: code.length > 0,
    retry: false,
  })
}
