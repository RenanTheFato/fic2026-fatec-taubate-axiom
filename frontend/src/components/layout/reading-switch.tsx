import type { ReactNode } from "react"
import { useEasyReading } from "../../hooks/use-reading-mode"

type ReadingSwitchProps = {
  /** Versão curta e direta, em frases simples. Uma ideia por frase. */
  simple: ReactNode
  /** Versão institucional completa. */
  children: ReactNode
}

// A troca de conteúdo do Modo Leitura Fácil. As duas versões existem no código
// e dizem a mesma coisa — a curta não é um resumo pela metade, é o mesmo fato
// escrito para ser entendido de primeira.
export function ReadingSwitch({ simple, children }: ReadingSwitchProps) {
  return useEasyReading() ? <>{simple}</> : <>{children}</>
}
