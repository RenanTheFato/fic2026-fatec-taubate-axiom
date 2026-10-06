import { NotFoundError } from "../../config/errors"
import type { Subscription, SubscriptionCharge } from "../../types/subscription-types"

// As datas são calculadas a partir de hoje, e não escritas fixas, para que a
// tela mostre um histórico coerente em qualquer dia em que for aberta.
function monthsAgo(count: number): string {
  const date = new Date()
  date.setMonth(date.getMonth() - count)

  return date.toISOString()
}

function nextMonth(): string {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)

  return date.toISOString()
}

function history(amount: string): SubscriptionCharge[] {
  return [1, 2, 3, 4].map((month) => ({
    id: String(month),
    amount,
    status: "paid" as const,
    charged_at: monthsAgo(month),
  }))
}

// O token é a credencial da tela, então é a única coisa que a função recebe. Um
// token curto demais nem chega a ser consultado: isso é erro de digitação ou
// link truncado por cliente de e-mail, e a resposta certa é a mesma de um código
// que não existe.
const MIN_TOKEN = 12

export async function getSubscription(token: string): Promise<Subscription> {
  if (token.trim().length < MIN_TOKEN) {
    throw new NotFoundError("Assinatura não encontrada")
  }

  const amount = "50.00"

  return {
    token,
    amount,
    payment_method: "credit_card",
    status: "active",
    started_at: monthsAgo(5),
    next_charge_at: nextMonth(),
    campaign: "Sustente o Ambulatório",
    charges: history(amount),
  }
}
