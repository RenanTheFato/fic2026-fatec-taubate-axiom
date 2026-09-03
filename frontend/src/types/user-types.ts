// Os papéis são os do backend, em inglês, e nunca reinventados em português
// aqui: quem decide permissão é a API, e um nome traduzido criaria duas
// verdades sobre a mesma coluna. A tradução para leitura acontece só na tela.
export const USER_ROLES = ["admin", "finance", "communication", "volunteer"] as const

export type UserRole = (typeof USER_ROLES)[number]

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administração",
  finance: "Financeiro",
  communication: "Comunicação",
  volunteer: "Voluntariado",
}
