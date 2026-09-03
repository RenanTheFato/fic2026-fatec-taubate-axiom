// Dinheiro chega da API como string (DECIMAL do MySQL) e continua string até
// aqui. Nunca fazer conta com Number no navegador.
export function formatCurrency(value: string | number): string {
  const amount = typeof value === "string" ? Number(value) : value

  if (!Number.isFinite(amount)) return "valor indisponível"

  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  })
}

export function formatNumber(value: number): string {
  return value.toLocaleString("pt-BR")
}

export function formatDate(iso: string): string {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) return "data indisponível"

  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
}

export function formatDayMonth(iso: string): { day: string; month: string } {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) return { day: "--", month: "---" }

  return {
    day: date.toLocaleDateString("pt-BR", { day: "2-digit" }),
    month: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase(),
  }
}
