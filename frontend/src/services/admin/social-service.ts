import axios from "axios"
import { api } from "../../config/api"
import { CheckoutError } from "../../config/errors"
import type { AdminSocialPage, SocialPostInput } from "../../types/social-types"

// A vitrine das redes no painel da Comunicação: cadastrar, esconder, apagar e,
// quando o token do Instagram está configurado no servidor, importar.

export async function listAllSocialPosts(): Promise<AdminSocialPage> {
  const { data } = await api.get<AdminSocialPage>("/social/list-all", { params: { limit: 50 } })

  return { posts: data.posts, total: data.total, instagram_import: data.instagram_import }
}

export async function saveSocialPost(input: SocialPostInput & { id?: string }): Promise<void> {
  const { id, ...body } = input

  try {
    if (id) await api.put(`/social/update/${encodeURIComponent(id)}`, body)
    else await api.post("/social/create", body)
  } catch (error: unknown) {
    throw refusal(error, "A publicação não foi salva. Confira o endereço, o texto e a foto.")
  }
}

export async function setSocialPostVisibility({ id, visible }: { id: string; visible: boolean }): Promise<void> {
  try {
    await api.patch(`/social/visibility/${encodeURIComponent(id)}`, { visible })
  } catch (error: unknown) {
    throw refusal(error, "A publicação não foi alterada.")
  }
}

export async function deleteSocialPost(id: string): Promise<void> {
  try {
    await api.delete(`/social/delete/${encodeURIComponent(id)}`)
  } catch (error: unknown) {
    throw refusal(error, "A publicação não foi apagada.")
  }
}

export type InstagramImport = { imported: number; skipped: number; failed: number }

export async function importInstagramPosts(): Promise<InstagramImport> {
  try {
    const { data } = await api.post<InstagramImport>("/social/import-instagram")

    return { imported: data.imported, skipped: data.skipped, failed: data.failed }
  } catch (error: unknown) {
    throw refusal(error, "O Instagram não respondeu. Tente de novo em instantes.")
  }
}

const REFUSALS: Record<string, string> = {
  "The address doesn't belong to the chosen network.": "O endereço não é da rede escolhida.",
  "The address must point to a YouTube video.": "O endereço precisa ser de um vídeo do YouTube.",
  "An Instagram or Facebook post needs its image.": "Publicação do Instagram ou do Facebook precisa da foto.",
}

function refusal(error: unknown, fallback: string): unknown {
  if (axios.isAxiosError(error) && error.response && (error.response.status === 400 || error.response.status === 404)) {
    const data = error.response.data as { error?: string; errors?: { message: string }[] } | undefined
    const message = data?.errors?.map((issue) => REFUSALS[issue.message]).find(Boolean)

    return new CheckoutError(message ?? fallback)
  }

  return error
}
