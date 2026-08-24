// O documento do doador nunca sai inteiro por endpoint aberto (regra 3.6). A verificação pública
// mostra o bastante para quem tem o recibo em mãos reconhecer o próprio documento, e não o
// bastante para alguém reconstruí-lo a partir da página.
export function maskDocument(document: string | null) {
  if (!document) {
    return null
  }

  const digits = document.replace(/\D/g, "")

  if (digits.length === 11) {
    return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`
  }

  if (digits.length === 14) {
    return `**.${digits.slice(2, 5)}.${digits.slice(5, 8)}/****-**`
  }

  return "*".repeat(digits.length)
}
