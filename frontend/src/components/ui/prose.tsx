import type { ReactNode } from "react"
import { cn } from "../../utils/cn"

type ProseProps = {
  children: ReactNode
  className?: string
}

// Texto corrido institucional. Existe por causa de uma regra só: linha longa
// cansa. A medida fica presa em ~65 caracteres mesmo numa tela de 27 polegadas,
// e o Modo Leitura Fácil aperta ainda mais.
export function Prose({ children, className }: ProseProps) {
  return (
    <div
      className={cn(
        "flex max-w-[65ch] flex-col gap-4 text-base leading-relaxed text-ink-soft sm:text-lg",
        className,
      )}
    >
      {children}
    </div>
  )
}
