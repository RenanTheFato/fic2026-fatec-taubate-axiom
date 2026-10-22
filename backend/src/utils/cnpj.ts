// Confere os dois dígitos verificadores do CNPJ. A conta pega o erro de digitação mais comum, um
// número trocado ou faltando, antes que a parceria nasça com um documento que o recibo da empresa
// vai imprimir errado. Não diz que a empresa existe: isso é a análise da associação.
export function isValidCnpj(value: string) {
  const digits = value.replace(/\D/g, "")

  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) {
    return false
  }

  function check(length: number) {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const sum = weights.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0)
    const rest = sum % 11

    return rest < 2 ? 0 : 11 - rest
  }

  return check(12) === Number(digits[12]) && check(13) === Number(digits[13])
}
