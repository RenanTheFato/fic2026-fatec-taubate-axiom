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
        "flex flex-col overflow-hidden rounded-card border border-line bg-surface",
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
