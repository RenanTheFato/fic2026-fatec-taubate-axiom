import type { ReactNode } from "react"
import { cn } from "../../utils/cn"
import { Container } from "./container"

type SectionProps = {
  children: ReactNode
  id?: string
  muted?: boolean
  className?: string
  labelledBy?: string
}

export function Section({ children, id, muted, className, labelledBy }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("py-16 sm:py-24", muted && "bg-surface-muted", className)}
    >
      <Container>{children}</Container>
    </section>
  )
}

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  description?: string
  id?: string
  align?: "left" | "center"
  tone?: "primary" | "success" | "institutional" | "partner"
}

const EYEBROW_TONE = {
  primary: "text-primary",
  success: "text-success-dark",
  institutional: "text-institutional-dark",
  partner: "text-partner-dark",
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
  align = "left",
  tone = "primary",
}: SectionHeadingProps) {
  return (
    <header className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && (
        <p className={cn("font-display text-sm font-bold tracking-[0.18em] uppercase", EYEBROW_TONE[tone])}>
          {eyebrow}
        </p>
      )}
      <h2 id={id} className="mt-3 text-3xl font-extrabold sm:text-4xl">
        {title}
      </h2>
      {description && <p className="mt-4 text-base leading-relaxed text-ink-soft sm:text-lg">{description}</p>}
    </header>
  )
}
