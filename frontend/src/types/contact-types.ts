// Espelha o domínio `contact` do backend: os formulários do site e o pedido de
// retirada do Mural do Bem chegam todos à mesma caixa de entrada do painel.
export type ContactChannel = "contact" | "ombudsman" | "work" | "wall_removal"

export type ContactStatus = "open" | "resolved"

/**
 * Só existe no pedido de retirada. `listed`: o e-mail tem nome no mural;
 * `not_listed`: é de um doador, mas nada dele aparece; `no_donor`: nenhum
 * doador usa esse e-mail.
 */
export type WallStatus = "listed" | "not_listed" | "no_donor"

export type ContactMessage = {
  id: string
  channel: ContactChannel
  subject: string | null
  name: string
  email: string
  phone: string | null
  message: string | null
  status: ContactStatus
  resolved_at: string | null
  resolver: { id: string; name: string } | null
  wall_status: WallStatus | null
  created_at: string
}

export type ContactPage = {
  contacts: ContactMessage[]
  total: number
  /** Abertas nos canais que o papel lê, qualquer que seja o filtro. */
  open: number
}

export type ContactFilters = {
  status: ContactStatus | null
  channel: ContactChannel | null
  page: number
}

export type ContactInput = {
  channel: Exclude<ContactChannel, "wall_removal">
  subject: string
  name: string
  email: string
  phone: string | null
  message: string
}

export type WallRemovalInput = {
  name: string
  email: string
  message: string | null
}
