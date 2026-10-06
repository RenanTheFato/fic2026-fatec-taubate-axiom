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
//
// O `paste` cai no elemento que tem o foco. Com a máquina toda ocupada, o foco
// do clique às vezes ainda não chegou quando o `paste` dispara, e o valor ia
// parar no campo anterior: o e-mail virava "joana@exemplo.com19998877665" e o
// telefone ficava vazio. Conferir o foco antes de colar fecha essa janela.
export async function fillField(user: User, label: RegExp, value: string) {
  const field = screen.getByLabelText(label)

  await user.click(field)

  if (document.activeElement !== field) {
    field.focus()
  }

  await user.paste(value)

  return field
}
