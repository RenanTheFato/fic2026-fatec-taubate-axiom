import axios from "axios"
import { api } from "../../config/api"
import { CheckoutError } from "../../config/errors"
import type { ContactFilters, ContactMessage, ContactPage } from "../../types/contact-types"

export const MESSAGES_PER_PAGE = 20

// `GET /contact/list` responde a admin e comunicação, e o backend ainda filtra o
// canal pelo papel: ouvidoria e candidatura só chegam à administração.
export async function listMessages({ status, channel, page }: ContactFilters): Promise<ContactPage> {
  const { data } = await api.get<ContactPage>("/contact/list", {
    params: {
      page,
      limit: MESSAGES_PER_PAGE,
      ...(status ? { status } : {}),
      ...(channel ? { channel } : {}),
    },
  })

  return { contacts: data.contacts, total: data.total, open: data.open }
}

export async function resolveMessage(id: string): Promise<ContactMessage> {
  try {
    const { data } = await api.patch<{ contact: ContactMessage }>(`/contact/resolve/${encodeURIComponent(id)}`)

    return data.contact
  } catch (error: unknown) {
    throw refusal(error, "A mensagem não pôde ser marcada como resolvida.")
  }
}

// Desmarca o consentimento em toda contribuição do e-mail do pedido e resolve o
// pedido junto. Devolve quantas contribuições deixaram de mostrar o nome.
export async function withdrawFromWall(id: string): Promise<number> {
  try {
    const { data } = await api.patch<{ withdrawn: number }>(`/contact/withdraw-from-wall/${encodeURIComponent(id)}`)

    return data.withdrawn
  } catch (error: unknown) {
    throw refusal(error, "O nome não pôde ser retirado do mural.")
  }
}

function refusal(error: unknown, fallback: string): unknown {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data as { error?: string } | undefined

    if (error.response.status === 400 || error.response.status === 404) {
      return new CheckoutError(data?.error ?? fallback)
    }
  }

  return error
}
