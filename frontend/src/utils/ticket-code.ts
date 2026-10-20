// O código do ingresso como a portaria o recebe: digitado à mão ("7kq2m x9d4r",
// com O no lugar de zero) ou colado por um leitor de mão, que digita o endereço
// inteiro do QR. As duas formas viram os mesmos dez caracteres que o backend
// guarda. Mesma regra de `backend/src/utils/ticket-code.ts`.
export function extractTicketCode(input: string): string | null {
  const last = input.trim().split("/").filter((part) => part.length > 0).pop() ?? ""
  const code = last.toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1")

  return code.length === 10 ? code : null
}

export function formatTicketCode(code: string): string {
  const clean = code.replace(/-/g, "")

  return clean.length === 10 ? `${clean.slice(0, 5)}-${clean.slice(5)}` : code
}
