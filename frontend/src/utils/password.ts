// As regras de senha do backend (`POST /user/create`, `/partner/apply`,
// `/volunteer/apply`), conferidas antes de enviar para a pessoa saber na hora o
// que falta, e não depois de um 400.
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Use pelo menos 8 caracteres."
  if (!/[A-Z]/.test(password)) return "Inclua pelo menos uma letra maiúscula."
  if (!/[0-9]/.test(password)) return "Inclua pelo menos um número."
  if (!/[@#$*&]/.test(password)) return "Inclua pelo menos um destes símbolos: @ # $ * &."

  return null
}

export const PASSWORD_HINT = "Pelo menos 8 caracteres, com uma letra maiúscula, um número e um destes símbolos: @ # $ * &."
