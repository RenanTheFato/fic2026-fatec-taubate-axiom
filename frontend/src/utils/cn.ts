// Junta classes condicionais sem trazer dependência: o projeto escreve os
// próprios componentes, então também escreve o próprio utilitário.
export type ClassValue = string | false | null | undefined

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ")
}
