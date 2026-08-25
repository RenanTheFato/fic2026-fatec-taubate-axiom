export function toCents(amount: string | number) {
  return Math.round(Number(amount) * 100)
}

export function fromCents(cents: number) {
  return (cents / 100).toFixed(2)
}
export function hasAtMostTwoDecimals(amount: number) {
  const cents = amount * 100

  return Math.abs(cents - Math.round(cents)) < 1e-6
}
