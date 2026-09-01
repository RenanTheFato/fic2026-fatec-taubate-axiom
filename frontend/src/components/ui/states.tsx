import type { ReactNode } from "react"
import { cn } from "../../utils/cn"

// Toda tela que lê a API mostra os três estados. Eles moram aqui para não
// serem reinventados (e esquecidos) a cada página.

type SkeletonProps = {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-xl bg-line/70", className)} aria-hidden="true" />
}

export function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

type StateMessageProps = {
  title: string
  description: string
  action?: ReactNode
  tone?: "neutral" | "error"
}

export function StateMessage({ title, description, action, tone = "neutral" }: StateMessageProps) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn(
        "flex flex-col items-start gap-3 rounded-card border p-6",
        tone === "error" ? "border-primary/40 bg-primary-soft" : "border-line bg-surface-muted",
      )}
    >
      <p className="font-display text-lg font-bold">{title}</p>
      <p className="text-sm text-ink-soft">{description}</p>
      {action}
    </div>
  )
}
