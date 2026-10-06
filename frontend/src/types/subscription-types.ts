import type { PaymentMethod } from "./transaction-types"

// Doação recorrente vista pela pessoa que doa. O acesso é pelo token de gestão
// que vai no e-mail de cada cobrança, e não por login: quem doa todo mês não
// precisa ter conta no sistema para poder parar de doar.
export type SubscriptionStatus = "active" | "paused" | "cancelled"

export type SubscriptionChargeStatus = "paid" | "pending" | "failed"

export type SubscriptionCharge = {
  id: string
  amount: string
  status: SubscriptionChargeStatus
  charged_at: string
}

export type Subscription = {
  /** Credencial da tela: aparece na URL e no e-mail, nunca em uma listagem. */
  token: string
  /** DECIMAL como string, igual ao resto do sistema. */
  amount: string
  payment_method: PaymentMethod
  status: SubscriptionStatus
  started_at: string
  /** `null` quando a doação está pausada ou cancelada, porque não há próxima. */
  next_charge_at: string | null
  /** Campanha à qual a doação está vinculada, quando existe uma. */
  campaign: string | null
  charges: SubscriptionCharge[]
}
