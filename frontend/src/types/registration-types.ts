import type { EventStatus } from "./event-types"

// Espelha o domínio `registration` do backend. O código chega formatado
// ("7KQ2M-X9D4R") e é a credencial da página do ingresso.
export type RegistrationStatus = "confirmed" | "cancelled"

export type RegistrationInput = {
  event_id: string
  participant_name: string
  participant_email: string
  participant_phone: string | null
}

export type CreatedRegistration = {
  id: string
  ticket_code: string
  participant_name: string
  status: RegistrationStatus
  event: { title: string; slug: string; starts_at: string }
}

// O que a página pública do ingresso recebe: o nome, que a portaria confere, e
// nunca o e-mail nem o telefone.
export type Ticket = {
  id: string
  ticket_code: string
  participant_name: string
  status: RegistrationStatus
  /** Convite comprado no caixa; falso na inscrição de evento gratuito. */
  paid: boolean
  checked_in_at: string | null
  event: {
    id: string
    title: string
    slug: string
    location: string | null
    starts_at: string
    ends_at: string | null
    status: EventStatus
  }
  /** QR em SVG como `data:` URL. Carrega o endereço desta página. */
  qr: string
}

export type Registration = {
  id: string
  event_id: string
  transaction_id: string | null
  ticket_code: string
  participant_name: string
  participant_email: string
  participant_phone: string | null
  status: RegistrationStatus
  checked_in_at: string | null
  checker: { id: string; name: string } | null
  cancelled_at: string | null
  created_at: string
}

export type RegistrationList = {
  event: {
    id: string
    title: string
    slug: string
    location: string | null
    starts_at: string
    ends_at: string | null
    ticket_price: string
    capacity: number | null
    taken_seats: number
    status: EventStatus
  }
  registrations: Registration[]
  total: number
  summary: { confirmed: number; checked_in: number; cancelled: number }
}
