import type { ReactNode } from "react"
import { cn } from "../../utils/cn"

type CardProps = {
  children: ReactNode
  className?: string
  interactive?: boolean
  as?: "div" | "article" | "li"
}

// Unidade visual padrão de evento, notícia, produto, necessidade e badge.
// Se algum desses precisar de estrutura própria, o primitivo é que está errado.
export function Card({ children, className, interactive, as: Tag = "div" }: CardProps) {
  return (
    <Tag
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface",
        interactive && "transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
    >
      {children}
    </Tag>
  )
}

type CardBodyProps = {
  children: ReactNode
  className?: string
}

export function CardBody({ children, className }: CardBodyProps) {
  return <div className={cn("flex flex-1 flex-col gap-3 p-5 sm:p-6", className)}>{children}</div>
}

// Título e resumo de card reservam a altura do seu número de linhas, cheios ou
// não. Numa grade, um título de uma linha ao lado de um de três empurra tudo o
// que vem depois e é o que faz dois cards vizinhos parecerem desalinhados:
// `line-clamp` sozinho corta o texto longo, mas não sustenta o curto. `lh` é a
// altura de linha do próprio elemento, então a reserva acompanha a tipografia
// em vez de repetir um número mágico.
const CLAMP: Record<number, string> = {
  1: "line-clamp-1 min-h-[1lh]",
  2: "line-clamp-2 min-h-[2lh]",
  3: "line-clamp-3 min-h-[3lh]",
}

type CardTitleProps = {
  children: ReactNode
  /** Linhas reservadas. Duas serve a título de evento, notícia e produto. */
  lines?: 1 | 2 | 3
  className?: string
}

export function CardTitle({ children, lines = 2, className }: CardTitleProps) {
  return (
    <h3 className={cn("font-display text-lg leading-snug font-bold", CLAMP[lines], className)}>
      {children}
    </h3>
  )
}

type CardTextProps = {
  children: ReactNode
  lines?: 1 | 2 | 3
  className?: string
}

export function CardText({ children, lines = 2, className }: CardTextProps) {
  return (
    <p className={cn("text-sm leading-relaxed text-ink-soft", CLAMP[lines], className)}>{children}</p>
  )
}
