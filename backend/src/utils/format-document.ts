// O documento é guardado só com dígitos e ganha pontuação na hora de imprimir. O recibo em PDF
// leva o número inteiro de propósito: é o documento fiscal do próprio doador, e é o CPF completo
// que serve para declarar a doação. Quem mascara é a verificação pública, que é a página feita
// para ser mostrada a terceiros.
export function formatDocument(document: string | null) {
  if (!document) {
    return null
  }

  const digits = document.replace(/\D/g, "")

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }

  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
  }

  return document
}
