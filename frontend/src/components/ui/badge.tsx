import type { ReactNode } from "react"
import { cn } from "../../utils/cn"

export type BadgeTone = "primary" | "success" | "alert" | "institutional" | "reward" | "partner"

type BadgeProps = {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}

// As cores vivas da marca (turquesa, amarelo) e o Frevo são claras demais para
// texto branco: sobre elas o texto é sempre ink. Onde a cor precisa virar texto,
// entra a variante escura. Está travado aqui para não depender de quem usa
// lembrar da tabela de contraste.
const TONES: Record<BadgeTone, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success-dark",
  alert: "bg-alert text-ink",
  institutional: "bg-institutional-soft text-institutional-dark",
  reward: "bg-reward text-ink",
  partner: "bg-partner/12 text-partner-dark",
}

export function Badge({ children, tone = "primary", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-pill px-3 py-1 font-display text-xs font-bold tracking-wide uppercase",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
