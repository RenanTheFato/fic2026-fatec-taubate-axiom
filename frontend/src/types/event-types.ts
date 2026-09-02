// Espelha EventInterface do backend. Datas chegam como string no JSON, e
// ticket_price é DECIMAL — string, nunca number.
export type EventStatus = "draft" | "published" | "cancelled" | "finished"

export type Event = {
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
  /** Caminho da imagem em `public/imagens/eventos/`. `null` enquanto não existir. */
  image: string | null
}
