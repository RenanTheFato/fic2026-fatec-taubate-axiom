// O que os formulários do painel trocam com os campos nativos de data e de
// dinheiro. `<input type="date">` e `datetime-local` falam em hora local, sem
// fuso, e a API fala em ISO com fuso: a conversão mora aqui, uma vez, para que
// um evento das 19h não vire 22h no caminho de ida e volta.

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

export function toDateInput(iso: string | null): string {
  if (!iso) return ""

  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) return ""

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function toDateTimeInput(iso: string | null): string {
  if (!iso) return ""

  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) return ""

  return `${toDateInput(iso)}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Meia-noite local do dia escolhido, em ISO. `null` para o campo vazio. */
export function fromDateInput(value: string): string | null {
  if (!value) return null

  const date = new Date(`${value}T00:00:00`)

  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function fromDateTimeInput(value: string): string | null {
  if (!value) return null

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

// Aceita "1.234,56", "1234,56" e "1234.56". Devolve `null` para o que não é
// valor com no máximo dois decimais, porque o backend recusaria de qualquer jeito.
export function parseMoneyInput(value: string): number | null {
  const text = value.trim().replace(/\s|R\$/g, "")

  if (!text) return null

  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null

  return Number(normalized)
}

// O valor que vem da API ("1500.00") no formato que a pessoa digita ("1500,00").
export function toMoneyInput(value: string | null): string {
  return value ? value.replace(".", ",") : ""
}
