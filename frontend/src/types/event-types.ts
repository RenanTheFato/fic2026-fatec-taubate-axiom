// Espelha EventInterface do backend. Datas chegam como string no JSON, e
// ticket_price é DECIMAL, ou seja, string, nunca number.
export type EventStatus = "draft" | "published" | "cancelled" | "finished"

export type ApiEvent = {
  id: string
  campaign_id: string | null
  title: string
  slug: string
  description: string | null
  location: string | null
  /** Caminho da foto em `public/imagens/`, gravado no banco. */
  image_url: string | null
  starts_at: string
  ends_at: string | null
  ticket_price: string
  capacity: number | null
  taken_seats: number
  status: EventStatus
}

// `image` é o `image_url` da API com o nome que os cards usam para toda foto.
// A conversão acontece no serviço, uma vez, e o card nunca lê o nome da coluna.
export type Event = ApiEvent & {
  /** Caminho da foto em `public/imagens/`. `null` quando o evento não tem foto. */
  image: string | null
}
