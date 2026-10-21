import { randomBytes } from "node:crypto";

// O código da inscrição é a credencial da página do ingresso e o que a portaria digita quando o
// leitor falha. Dez caracteres do alfabeto de Crockford (sem I, L, O e U) dão 50 bits: impossível
// de adivinhar e ainda curto o bastante para ler em voz alta. Como 256 é múltiplo de 32, o resto da
// divisão de cada byte não favorece nenhuma letra.

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

const LENGTH = 10

export function generateTicketCode() {
  return Array.from(randomBytes(LENGTH), (byte) => ALPHABET[byte % ALPHABET.length]).join("")
}

// Aceita o código como a pessoa o escreve: "abcde-12345", com espaço, minúsculo, com O no lugar de
// zero ou L no lugar de um. Tirar o código do endereço que o QR carrega é trabalho do painel, antes
// de chamar a rota, porque um endereço não cabe no parâmetro do caminho.
export function normalizeTicketCode(input: string) {
  return input.toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1")
}

export function formatTicketCode(code: string) {
  return code.length === LENGTH ? `${code.slice(0, 5)}-${code.slice(5)}` : code
}
