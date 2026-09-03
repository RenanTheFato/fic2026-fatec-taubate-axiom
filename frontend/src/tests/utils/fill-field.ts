import { screen } from "@testing-library/react"
import type userEvent from "@testing-library/user-event"

type User = ReturnType<typeof userEvent.setup>

// `user.type` escreve tecla a tecla, e cada tecla é uma atualização de estado
// num campo controlado. Com a suíte inteira rodando em paralelo, uma
// re-renderização no meio da digitação chega a derrubar caracteres, e o campo
// fica com "Maria Aparecida" no lugar de "Maria Aparecida da Silva", e o teste
// falha por motivo nenhum.
//
// Colar entrega o valor inteiro num evento só. Continua sendo interação de
// usuário de verdade (foco no campo e `paste`), e é determinístico.
export async function fillField(user: User, label: RegExp, value: string) {
  const field = screen.getByLabelText(label)

  await user.click(field)
  await user.paste(value)

  return field
}
