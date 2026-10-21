import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckoutError } from "../config/errors"
import {
  createEvent,
  deleteFromCatalog,
  saveCampaign,
  saveProduct,
  updateEvent,
  updateEventCapacity,
} from "../services/admin/catalog-editor-service"
import type { EventInput } from "../services/admin/catalog-editor-service"
import { uploadPhoto } from "../services/admin/photo-service"

// Cadastrar, editar ou excluir muda o que o site mostra, então o cache da
// listagem pública do domínio cai junto com o do painel, como nas ações de
// publicar e encerrar.
function useCatalogMutation<TInput, TResult>(domain: "campaigns" | "events" | "products", mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    retry: false,
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: [domain] })
    },
  })
}

export function useSaveCampaign() {
  return useCatalogMutation("campaigns", saveCampaign)
}

export function useSaveProduct() {
  return useCatalogMutation("products", saveProduct)
}

type SaveEvent = {
  id?: string
  input: EventInput
  capacity: number | null
  /** Na edição: a lotação mudou e precisa da rota própria dela. */
  capacityChanged: boolean
}

// O evento salva em dois passos quando a lotação muda junto com o cadastro,
// porque a lotação tem rota própria. Se o segundo passo for recusado, a tela
// diz exatamente isso: o cadastro ficou salvo e a lotação não, para ninguém
// achar que as duas coisas falharam ou que as duas deram certo.
export function useSaveEvent() {
  return useCatalogMutation("events", async ({ id, input, capacity, capacityChanged }: SaveEvent) => {
    if (!id) return createEvent({ ...input, capacity })

    const saved = await updateEvent(id, input)

    if (!capacityChanged) return saved

    try {
      return await updateEventCapacity(id, capacity)
    } catch (error: unknown) {
      const reason = error instanceof CheckoutError ? ` ${error.message}` : ""

      throw new CheckoutError(`Os dados do evento foram salvos, mas a lotação não mudou.${reason}`)
    }
  })
}

const DOMAIN_KEY = { campaign: "campaigns", event: "events", product: "products" } as const

export function useDeleteFromCatalog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteFromCatalog,
    retry: false,
    onSuccess: async (_result, deletion) => {
      await queryClient.invalidateQueries({ queryKey: [DOMAIN_KEY[deletion.domain]] })
    },
  })
}

export function useUploadPhoto() {
  return useMutation({ mutationFn: uploadPhoto, retry: false })
}
