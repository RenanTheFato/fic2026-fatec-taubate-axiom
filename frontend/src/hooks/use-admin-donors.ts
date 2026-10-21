import { useMutation, useQueryClient } from "@tanstack/react-query"
import { anonymizeDonor, createDonor, updateDonor } from "../services/admin/donor-actions-service"
import type { DonorInput } from "../services/admin/donor-actions-service"

type SaveDonor = { id?: string; input: DonorInput; document: string | null }

// Um formulário só para cadastrar e editar. O documento só vai no cadastro:
// depois dele, é o que liga a pessoa aos recibos e não muda.
export function useSaveDonor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input, document }: SaveDonor) => {
      if (id) return { donor: await updateDonor(id, input), created: false }

      return createDonor({ ...input, document })
    },
    retry: false,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["donors"] })
    },
  })
}

// Anonimizar também tira o nome do Mural do Bem, que nunca mostra doador
// anonimizado, então o cache do mural cai junto.
export function useAnonymizeDonor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: anonymizeDonor,
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["donors"] })
      await queryClient.invalidateQueries({ queryKey: ["supporters"] })
    },
  })
}
