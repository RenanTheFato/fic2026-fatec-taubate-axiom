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
  starts_at: string
  ends_at: string | null
  ticket_price: string
  capacity: number | null
  taken_seats: number
  status: EventStatus
}

// `image` não vem da API: a tabela `events` não guarda imagem ainda. O serviço
// resolve o caminho a partir do slug antes de entregar o evento à tela, então o
// dia em que a coluna existir só o serviço muda.
export type Event = ApiEvent & {
  /** Caminho da imagem em `public/imagens/eventos/`. `null` enquanto não existir. */
  image: string | null
}
